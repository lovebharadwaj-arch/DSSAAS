import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parse } from "csv-parse/sync";
import { pool } from "../config/postragesql.ts";

export interface SaveCleanedDatasetOptions {
  removeDuplicates: boolean;
  missingValues: "keep" | "drop_rows" | "fill_empty";
}

interface DatasetVersionRow {
  id: string;
  dataset_id: string;
  version_number: number;
  storage_key: string;
  file_size_bytes: number;
  schema_snapshot: {
    columns: string[];
    rowCount: number;
  };
  created_at: string;
}

function stringifyCsv(records: string[][]): string {
  return (
    records
      .map((row) =>
        row
          .map((value) => {
            const escaped = value.replace(/"/g, '""');

            return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
          })
          .join(","),
      )
      .join("\r\n") + "\r\n"
  );
}

function cleanRows(
  rows: string[][],
  options: SaveCleanedDatasetOptions,
): string[][] {
  let cleaned = rows;

  if (options.missingValues === "drop_rows") {
    cleaned = cleaned.filter((row) =>
      row.every((value) => value.trim() !== ""),
    );
  } else if (options.missingValues === "fill_empty") {
    cleaned = cleaned.map((row) =>
      row.map((value) => (value.trim() === "" ? "N/A" : value)),
    );
  }

  if (options.removeDuplicates) {
    const seen = new Set<string>();

    cleaned = cleaned.filter((row) => {
      const key = JSON.stringify(row);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  return cleaned;
}

export async function saveCleanedDatasetVersion(
  organizationId: string,
  datasetId: string,
  userId: string,
  options: SaveCleanedDatasetOptions,
) {
  const original = await pool.query<{ storage_key: string }>(
    `SELECT storage_key
     FROM public.datasets
     WHERE id = $1
       AND organization_id = $2
       AND status <> 'deleted'`,
    [datasetId, organizationId],
  );

  if (original.rows.length === 0) {
    throw new Error("DATASET_NOT_FOUND");
  }

  const originalPath = path.join(
    process.cwd(),
    "uploads",
    "datasets",
    path.basename(original.rows[0].storage_key),
  );

  const csvText = await fs.readFile(originalPath, "utf8");

  const records = parse(csvText, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
    max_record_size: 1024 * 1024,
  }) as string[][];

  if (records.length === 0 || records[0].length === 0) {
    throw new Error("EMPTY_CSV");
  }

  const columns = records[0].map((column) => column.trim());

  if (
    columns.some((column) => !column) ||
    new Set(columns).size !== columns.length
  ) {
    throw new Error("INVALID_CSV");
  }

  const rows = records.slice(1);

  if (rows.some((row) => row.length !== columns.length)) {
    throw new Error("INVALID_CSV");
  }

  const cleanedRows = cleanRows(rows, options);
  const cleanedCsv = stringifyCsv([columns, ...cleanedRows]);
  const fileName = `${randomUUID()}.csv`;
  const storageKey = `local/datasets/${fileName}`;

  const uploadDirectory = path.join(process.cwd(), "uploads", "datasets");

  const newFilePath = path.join(uploadDirectory, fileName);

  await fs.mkdir(uploadDirectory, { recursive: true });

  // Create a new file. Never overwrite the original.
  await fs.writeFile(newFilePath, cleanedCsv, {
    encoding: "utf8",
    flag: "wx",
  });

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    // Lock the dataset row so concurrent saves serialize
    // version-number allocation for this dataset.
    const dataset = await client.query(
      `SELECT id
       FROM public.datasets
       WHERE id = $1
         AND organization_id = $2
         AND status <> 'deleted'
       FOR UPDATE`,
      [datasetId, organizationId],
    );

    if (dataset.rows.length === 0) {
      throw new Error("DATASET_NOT_FOUND");
    }

    const versionResult = await client.query<{ next_version: number }>(
      `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
       FROM public.dataset_versions
       WHERE dataset_id = $1`,
      [datasetId],
    );

    const versionNumber = Number(versionResult.rows[0].next_version);

    const fileSizeBytes = Buffer.byteLength(cleanedCsv, "utf8");

    const inserted = await client.query<DatasetVersionRow>(
      `INSERT INTO public.dataset_versions (
         organization_id,
         dataset_id,
         version_number,
         storage_key,
         file_size_bytes,
         schema_snapshot,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       RETURNING
         id,
         dataset_id,
         version_number,
         storage_key,
         file_size_bytes,
         schema_snapshot,
         created_at`,
      [
        organizationId,
        datasetId,
        versionNumber,
        storageKey,
        fileSizeBytes,
        JSON.stringify({
          columns,
          rowCount: cleanedRows.length,
        }),
        userId,
      ],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return {
      ...inserted.rows[0],
      originalRowCount: rows.length,
      cleanedRowCount: cleanedRows.length,
      rowsRemoved: rows.length - cleanedRows.length,
    };
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    // Remove the new file if registering its version failed.
    await fs.unlink(newFilePath).catch(() => undefined);

    throw error;
  } finally {
    client.release();
  }
}
