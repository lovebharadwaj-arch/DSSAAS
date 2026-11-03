import { parse } from "csv-parse";
import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";

import { pool } from "../config/postragesql.ts";
import { trainPythonModel } from "../services/ML.Service.ts";
import {
  createModelRecord,
  createTrainingJob,
  ensureModelArtifactDirectory,
  updateTrainingJobStatus,
} from "../services/mlJob.service.ts";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";

type TrainingTask = "classification" | "regression";

async function loadDatasetRows(filePath: string): Promise<Record<string, string | null>[]> {
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

  return rows;
}

export async function trainDatasetModelHandler(req: Request, res: Response) {
  try {
    const organizationId = Array.isArray(req.params.organizationId)
      ? req.params.organizationId[0]
      : req.params.organizationId;
    const datasetId = Array.isArray(req.params.datasetId)
      ? req.params.datasetId[0]
      : req.params.datasetId;
    const userId = (req as AuthenticatedRequest).user?.id;

    const {
      targetColumn,
      task,
      testSize = 0.2,
    }: {
      targetColumn?: string;
      task?: TrainingTask;
      testSize?: number;
    } = req.body ?? {};

    if (!organizationId || !datasetId || !userId) {
      return res.status(400).json({
        message: "Organization ID, dataset ID, and authenticated user are required.",
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

    const datasetResult = await pool.query<{
      id: string;
      name: string;
      storage_key: string;
      status: string;
    }>(
      `SELECT id, name, storage_key, status
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

    const filePath = path.resolve(process.cwd(), "uploads", "datasets", path.basename(dataset.storage_key));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "The dataset file could not be found.",
      });
    }

    const rows = await loadDatasetRows(filePath);

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

    const job = await createTrainingJob({
      organizationId,
      datasetId: dataset.id,
      userId,
      task,
      targetColumn,
      testSize,
      algorithm: "random_forest",
    });

    const artifactDirectory = await ensureModelArtifactDirectory();
    const artifactPath = path.join(artifactDirectory, `${job.id}.joblib`);

    const runJob = async (): Promise<void> => {
      const startedAt = new Date();

      try {
        await updateTrainingJobStatus(organizationId, job.id, "running", {
          resultSummary: {
            dataset_id: dataset.id,
            target_column: targetColumn,
            task,
            test_size: testSize,
          },
          startedAt,
        });

        const result = await trainPythonModel({
          rows,
          target_column: targetColumn,
          task,
          test_size: testSize,
          artifact_path: artifactPath,
        });

        await updateTrainingJobStatus(
          organizationId,
          job.id,
          "completed",
          {
            resultSummary: {
              dataset_id: dataset.id,
              target_column: targetColumn,
              task,
              test_size: testSize,
              model: result,
            },
            startedAt,
            finishedAt: new Date(),
          },
        );

        await createModelRecord({
          organizationId,
          analysisJobId: job.id,
          name: `${dataset.name} ${task} model`,
          algorithm: result.algorithm ?? "random_forest",
          taskType: task,
          metrics: (result.metrics ?? {}) as Record<string, number>,
          artifactKey: `models/${path.basename(artifactPath)}`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Model training failed.";

        await updateTrainingJobStatus(
          organizationId,
          job.id,
          "failed",
          {
            resultSummary: {
              dataset_id: dataset.id,
              target_column: targetColumn,
              task,
              test_size: testSize,
            },
            errorMessage: message,
            startedAt,
            finishedAt: new Date(),
          },
        );
      }
    };

    void runJob();

    return res.status(202).json({
      success: true,
      message: "Training job started.",
      job: {
        id: job.id,
        status: job.status,
        organizationId,
        datasetId: dataset.id,
        createdAt: job.created_at,
      },
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
