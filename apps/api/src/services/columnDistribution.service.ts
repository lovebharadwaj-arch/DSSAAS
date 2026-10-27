import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { pool } from "../config/postragesql.ts";

type DistributionType = "number" | "boolean" | "string" | "unknown";

interface DistributionResponse {
  columnName: string;
  dataType: string;
  rowCount: number;
  missingCount: number;
  validCount: number;
  invalidCount?: number;
  uniqueCount?: number;
  histogram?: Array<{
    from: number;
    to: number;
    count: number;
  }>;
  topValues?: Array<{
    value: string;
    count: number;
  }>;
  statistics?: Record<string, number> | null;
  outliers?: {
    count: number;
    lowerBound: number;
    upperBound: number;
  } | null;
}

export async function getColumnDistribution(
  organizationId: string,
  datasetId: string,
  columnName: string,
  bins = 10,
): Promise<DistributionResponse> {
  const datasetResult = await pool.query(
    `SELECT storage_key
     FROM public.datasets
     WHERE id = $1
       AND organization_id = $2
       AND status <> 'deleted'
     LIMIT 1`,
    [datasetId, organizationId],
  );

  if (datasetResult.rowCount === 0) {
    throw new Error("DATASET_NOT_FOUND");
  }

  const storageKey = datasetResult.rows[0].storage_key as string;
  const filename = path.basename(storageKey);
  const filePath = path.join(process.cwd(), "uploads", "datasets", filename);

  const csvText = await fs.readFile(filePath, "utf8");

  const records = parse(csvText, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
    max_record_size: 1024 * 1024,
  }) as string[][];

  if (records.length === 0) {
    throw new Error("EMPTY_CSV");
  }

  const headers = records[0].map((header) => header.trim());

  if (headers.length === 0 || headers.some((header) => !header)) {
    throw new Error("INVALID_CSV");
  }

  const columnIndex = headers.indexOf(columnName);

  if (columnIndex === -1) {
    throw new Error("COLUMN_NOT_FOUND");
  }

  const rows = records.slice(1);

  if (rows.length > 100_000) {
    throw new Error("TOO_MANY_ROWS");
  }

  const values = rows.map((row) => {
    if (row.length !== headers.length) {
      throw new Error("INVALID_CSV");
    }

    const value = row[columnIndex]?.trim();
    return value === "" || value === undefined ? null : value;
  });

  const nonMissingValues = values.filter(
    (value): value is string => value !== null,
  );

  const allNumeric =
    nonMissingValues.length > 0 &&
    nonMissingValues.every((value) => {
      const number = Number(value);
      return value.trim() !== "" && Number.isFinite(number);
    });

  const allBoolean =
    nonMissingValues.length > 0 &&
    nonMissingValues.every((value) =>
      ["true", "false"].includes(value.toLowerCase()),
    );

  const dataType: DistributionType = allNumeric
    ? "number"
    : allBoolean
      ? "boolean"
      : nonMissingValues.length > 0
        ? "string"
        : "unknown";

  const baseUrl = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000";

  const response = await fetch(`${baseUrl}/analyze/distribution`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      column_name: columnName,
      data_type: dataType,
      values,
      bins,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `ML_SERVICE_ERROR: Python service returned ${response.status}`,
    );
  }

  return (await response.json()) as DistributionResponse;
}
