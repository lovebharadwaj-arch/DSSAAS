import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { pool } from "../config/postragesql.ts";
import { saveDatasetProfile } from "./datasetProfile.service.ts";

type CsvRow = string[];

function isMissing(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

function getColumnType(values: string[]): string {
  const nonEmpty = values.filter((value) => !isMissing(value));

  if (nonEmpty.length === 0) return "unknown";

  if (nonEmpty.every((value) => !Number.isNaN(Number(value)))) {
    return "number";
  }

  if (
    nonEmpty.every(
      (value) =>
        value.toLowerCase() === "true" || value.toLowerCase() === "false",
    )
  ) {
    return "boolean";
  }

  return "string";
}

function getMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export async function profileCsvDataset(
  organizationId: string,
  datasetId: string,
) {
  // Always retrieve the file through an organization-scoped database query.
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

  // Local storage for the current development version.
  const filePath = path.join(
    process.cwd(),
    "uploads",
    "datasets",
    path.basename(dataset.storage_key),
  );

  const csvText = await fs.readFile(filePath, "utf8");

  const records = parse(csvText, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
    max_record_size: 1024 * 1024,
  }) as CsvRow[];

  if (records.length === 0 || records[0].length === 0) {
    throw new Error("EMPTY_CSV");
  }

  const headers = records[0];
  const rows = records.slice(1);

  if (rows.length > 0 && rows.some((row) => row.length !== headers.length)) {
    throw new Error("INVALID_CSV");
  }

  const seenRows = new Set<string>();
  let duplicateCount = 0;

  for (const row of rows) {
    const key = JSON.stringify(row);

    if (seenRows.has(key)) {
      duplicateCount++;
    } else {
      seenRows.add(key);
    }
  }

  const columns = headers.map((name, columnIndex) => {
    const values = rows.map((row) => row[columnIndex] ?? "");
    const nonMissing = values.filter((value) => !isMissing(value));
    const dataType = getColumnType(values);

    const uniqueCount = new Set(nonMissing.map((value) => value.trim())).size;

    const statistics: Record<string, unknown> = {
      missingPercentage:
        rows.length === 0
          ? 0
          : Number(
              (
                ((values.length - nonMissing.length) / rows.length) *
                100
              ).toFixed(2),
            ),
    };

    if (dataType === "number" && nonMissing.length > 0) {
      const numbers = nonMissing.map(Number);

      statistics.min = Math.min(...numbers);
      statistics.max = Math.max(...numbers);
      statistics.mean =
        numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
      statistics.median = getMedian(numbers);
    }

    if (dataType === "string") {
      const frequencies = new Map<string, number>();

      for (const value of nonMissing) {
        const normalized = value.trim();
        frequencies.set(normalized, (frequencies.get(normalized) ?? 0) + 1);
      }

      statistics.topValues = Array.from(frequencies.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, count]) => ({ value, count }));
    }

    return {
      name,
      dataType,
      missingCount: values.length - nonMissing.length,
      uniqueCount,
      statistics,
    };
  });

  return saveDatasetProfile({
    organizationId,
    datasetId,
    rowCount: rows.length,
    columnCount: headers.length,
    duplicateCount,
    columns,
  });
}
