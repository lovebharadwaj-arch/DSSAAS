import { parse } from "csv-parse";
import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";

import { pool } from "../config/postragesql.ts";
import { trainPythonModel } from "../services/ML.Service.ts";

type TrainingTask = "classification" | "regression";

export async function trainDatasetModelHandler(req: Request, res: Response) {
  try {
    const organizationId = req.params.organizationId;
    const datasetId = req.params.datasetId;

    const {
      targetColumn,
      task,
      testSize = 0.2,
    }: {
      targetColumn?: string;
      task?: TrainingTask;
      testSize?: number;
    } = req.body ?? {};

    if (!organizationId || !datasetId) {
      return res.status(400).json({
        message: "Organization ID and dataset ID are required.",
      });
    }

    if (!targetColumn?.trim()) {
      return res.status(400).json({
        message: "Target column is required.",
      });
    }

    if (task !== "classification" && task !== "regression") {
      return res.status(400).json({
        message: "Task must be classification or regression.",
      });
    }

    if (
      typeof testSize !== "number" ||
      !Number.isFinite(testSize) ||
      testSize < 0.1 ||
      testSize > 0.4
    ) {
      return res.status(400).json({
        message: "Test size must be between 0.1 and 0.4.",
      });
    }

    // Only retrieve a dataset owned by this organization.
    // The organization membership middleware must authorize
    // the authenticated user for this organization.
    const datasetResult = await pool.query<{
      id: string;
      storage_key: string;
      status: string;
    }>(
      `SELECT id, storage_key, status
       FROM public.datasets
       WHERE id = $1
         AND organization_id = $2
         AND status <> 'deleted'
       LIMIT 1`,
      [datasetId, organizationId],
    );

    const dataset = datasetResult.rows[0];

    if (!dataset) {
      return res.status(404).json({
        message: "Dataset not found.",
      });
    }

    // Match the local storage convention used by your preview service.
    const filename = path.basename(dataset.storage_key);

    const filePath = path.resolve(
      process.cwd(),
      "uploads",
      "datasets",
      filename,
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "The dataset file could not be found.",
      });
    }

    const parser = fs.createReadStream(filePath).pipe(
      parse({
        bom: true,
        columns: true,
        skip_empty_lines: true,
        relax_column_count: false,
        max_record_size: 1024 * 1024,
      }),
    );

    const rows: Record<string, string | null>[] = [];

    try {
      for await (const record of parser) {
        rows.push(record as Record<string, string | null>);
      }
    } finally {
      parser.destroy();
    }

    if (rows.length < 10) {
      return res.status(400).json({
        message: "At least 10 CSV data rows are required.",
      });
    }

    const columns = Object.keys(rows[0]);

    if (!columns.includes(targetColumn)) {
      return res.status(400).json({
        message: "Target column does not exist in the CSV.",
        availableColumns: columns,
      });
    }

    // Forward the data to the Python FastAPI service.
    const result = await trainPythonModel({
      rows,
      target_column: targetColumn,
      task,
      test_size: testSize,
    });

    return res.status(200).json({
      message: "Model training completed.",
      datasetId: dataset.id,
      result,
    });
  } catch (error) {
    console.error("ML training failed:", error);

    const message = error instanceof Error ? error.message : "";

    if (message.includes("aborted")) {
      return res.status(504).json({
        message: "Python ML service timed out.",
      });
    }

    return res.status(502).json({
      message: "Unable to train the model.",
    });
  }
}
