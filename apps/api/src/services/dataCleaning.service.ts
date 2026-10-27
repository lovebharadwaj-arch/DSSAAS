import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { pool } from "../config/postragesql.ts";

export interface CleaningOptions {
  removeDuplicates?: boolean;
  missingValues?: "keep" | "drop_rows" | "fill_empty";
}

interface CleaningResult {
  datasetId: string;
  columns: string[];
  originalRowCount: number;
  cleanedRowCount: number;
  duplicatesRemoved: number;
  rowsWithMissingValues: number;
  preview: string[][];
}

export async function previewDataCleaning(
  organizationId: string,
  datasetId: string,
  options: CleaningOptions,
): Promise<CleaningResult> {
  // 1. Verify the dataset belongs to this organization.
  const result = await pool.query(
    `SELECT storage_key
     FROM public.datasets
     WHERE id = $1
       AND organization_id = $2
       AND status <> 'deleted'
     LIMIT 1`,
    [datasetId, organizationId],
  );

  if (result.rows.length === 0) {
    throw new Error("DATASET_NOT_FOUND");
  }

  const storageKey = result.rows[0].storage_key as string | null;

  if (!storageKey) {
    throw new Error("DATASET_FILE_NOT_FOUND");
  }

  // 2. Resolve the existing upload path without changing the file.
  const filePath = path.join(
    process.cwd(),
    "uploads",
    "datasets",
    path.basename(storageKey),
  );

  let csvText: string;

  try {
    csvText = await fs.readFile(filePath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT" || code === "ENOTDIR") {
      throw new Error("DATASET_FILE_NOT_FOUND");
    }

    throw error;
  }

  // 3. Parse the CSV.
  let records: string[][];

  try {
    records = parse(csvText, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
      max_record_size: 1024 * 1024,
      trim: false,
    }) as string[][];
  } catch {
    throw new Error("INVALID_CSV");
  }

  if (records.length === 0 || records[0].length === 0) {
    throw new Error("EMPTY_CSV");
  }

  // 4. Validate column names.
  const columns = records[0].map((column) => column.trim());

  if (
    columns.some((column) => column.length === 0) ||
    new Set(columns).size !== columns.length
  ) {
    throw new Error("INVALID_CSV");
  }

  // 5. Validate row widths.
  const dataRows = records.slice(1);

  if (dataRows.some((row) => row.length !== columns.length)) {
    throw new Error("INVALID_CSV");
  }

  const originalRowCount = dataRows.length;

  // Count rows that contain at least one missing value.
  const rowsWithMissingValues = dataRows.filter((row) =>
    row.some((value) => value.trim() === ""),
  ).length;

  // Work on a new array; never mutate the parsed source rows.
  let cleanedRows = dataRows.map((row) => [...row]);

  // 6. Handle missing values.
  if (options.missingValues === "drop_rows") {
    cleanedRows = cleanedRows.filter((row) =>
      row.every((value) => value.trim() !== ""),
    );
  } else if (options.missingValues === "fill_empty") {
    cleanedRows = cleanedRows.map((row) =>
      row.map((value) => (value.trim() === "" ? "N/A" : value)),
    );
  }

  // 7. Remove duplicate rows.
  let duplicatesRemoved = 0;

  if (options.removeDuplicates) {
    const seen = new Set<string>();

    cleanedRows = cleanedRows.filter((row) => {
      // Trim values for comparison, but preserve original cell values
      // in the preview for rows that are retained.
      const key = JSON.stringify(row.map((value) => value.trim()));

      if (seen.has(key)) {
        duplicatesRemoved++;
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  // 8. Return a preview only. No database update or file write occurs.
  return {
    datasetId,
    columns,
    originalRowCount,
    cleanedRowCount: cleanedRows.length,
    duplicatesRemoved,
    rowsWithMissingValues,
    preview: cleanedRows.slice(0, 100),
  };
}
