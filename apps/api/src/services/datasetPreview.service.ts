import { parse } from "csv-parse";
import fs from "node:fs";
import path from "node:path";
import { pool } from "../config/postragesql.ts";

export async function previewDataset(
  organizationId: string,
  datasetId: string,
  limit: number,
) {
  const result = await pool.query<{ storage_key: string }>(
    `SELECT storage_key
     FROM public.datasets
     WHERE id = $1
       AND organization_id = $2
       AND status <> 'deleted'
     LIMIT 1`,
    [datasetId, organizationId],
  );

  const dataset = result.rows[0];

  if (!dataset) {
    throw new Error("DATASET_NOT_FOUND");
  }

  // This path matches the current local CSV upload storage.
  const filename = path.basename(dataset.storage_key);
  const filePath = path.join(process.cwd(), "uploads", "datasets", filename);

  const parser = fs.createReadStream(filePath).pipe(
    parse({
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
      max_record_size: 1024 * 1024,
    }),
  );

  let headers: string[] | null = null;
  const rows: string[][] = [];

  try {
    for await (const record of parser) {
      const values = record as string[];

      if (headers === null) {
        headers = values;
        continue;
      }

      rows.push(values);

      // Read one extra row to determine whether more data exists.
      if (rows.length > limit) {
        break;
      }
    }
  } finally {
    parser.destroy();
  }

  if (!headers || headers.length === 0) {
    throw new Error("EMPTY_CSV");
  }

  const hasMore = rows.length > limit;
  const previewRows = rows.slice(0, limit);

  return {
    datasetId,
    columns: headers,
    rows: previewRows.map((row) =>
      Object.fromEntries(
        headers!.map((header, index) => [header, row[index] ?? null]),
      ),
    ),
    rowCount: previewRows.length,
    limit,
    hasMore,
  };
}
