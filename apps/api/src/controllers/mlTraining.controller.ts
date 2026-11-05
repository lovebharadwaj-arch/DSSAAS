import { parse } from "csv-parse";
import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";

import { pool } from "../config/postragesql.ts";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import { trainPythonModel } from "../services/ML.Service.ts";

import {
  createModelRecord,
  createModelVersionRecord,
  createTrainingJob,
  getModelForOrganization,
  updateTrainingJobStatus,
} from "../services/mlJob.service.ts";

// IMPORTANT:
// Change this import path only if uuidSchema is defined in another file.

type TrainingTask = "classification" | "regression";

const uuidSchema = {
  safeParse(value: unknown) {
    const success =
      typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      );

    return { success };
  },
};

interface TrainingRequestBody {
  targetColumn?: string;
  task?: TrainingTask;
  algorithm?: string;
  testSize?: number;
  sourceModelId?: string;
}

async function loadDatasetRows(
  filePath: string,
): Promise<Record<string, string | null>[]> {
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

export async function trainDatasetModelHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    // -----------------------------------------
    // 1. Extract request information
    // -----------------------------------------

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
      algorithm = "random_forest",
      testSize = 0.2,
      sourceModelId,
    }: TrainingRequestBody = req.body ?? {};

    // -----------------------------------------
    // 2. Validate required IDs
    // -----------------------------------------

    if (!organizationId || !datasetId || !userId) {
      res.status(400).json({
        success: false,
        message:
          "Organization ID, dataset ID, and authenticated user are required.",
      });
      return;
    }

    if (!uuidSchema.safeParse(organizationId).success) {
      res.status(400).json({
        success: false,
        message: "Invalid organization ID.",
      });
      return;
    }

    if (!uuidSchema.safeParse(datasetId).success) {
      res.status(400).json({
        success: false,
        message: "Invalid dataset ID.",
      });
      return;
    }

    if (!uuidSchema.safeParse(userId).success) {
      res.status(400).json({
        success: false,
        message: "Invalid authenticated user ID.",
      });
      return;
    }

    // -----------------------------------------
    // 3. Validate training configuration
    // -----------------------------------------

    if (typeof targetColumn !== "string" || !targetColumn.trim()) {
      res.status(400).json({
        success: false,
        message: "Target column is required.",
      });
      return;
    }

    if (task !== "classification" && task !== "regression") {
      res.status(400).json({
        success: false,
        message: "Task must be classification or regression.",
      });
      return;
    }

    if (
      typeof algorithm !== "string" ||
      !algorithm.trim() ||
      algorithm.length > 100
    ) {
      res.status(400).json({
        success: false,
        message: "A valid algorithm is required.",
      });
      return;
    }

    if (
      typeof testSize !== "number" ||
      !Number.isFinite(testSize) ||
      testSize < 0.1 ||
      testSize > 0.4
    ) {
      res.status(400).json({
        success: false,
        message: "Test size must be between 0.1 and 0.4.",
      });
      return;
    }

    // -----------------------------------------
    // 4. Validate optional source model
    // -----------------------------------------

    let sourceModel: Awaited<
      ReturnType<typeof getModelForOrganization>
    > | null = null;

    if (sourceModelId !== undefined && sourceModelId !== null) {
      if (
        typeof sourceModelId !== "string" ||
        !uuidSchema.safeParse(sourceModelId).success
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid source model ID.",
        });
        return;
      }

      sourceModel = await getModelForOrganization(
        organizationId,
        sourceModelId,
      );

      if (!sourceModel || sourceModel.status !== "ready") {
        res.status(404).json({
          success: false,
          message: "Source model not found or is not ready.",
        });
        return;
      }

      if (sourceModel.task_type !== task) {
        res.status(400).json({
          success: false,
          message: "The new training task must match the source model task.",
        });
        return;
      }
    }

    // -----------------------------------------
    // 5. Verify dataset belongs to organization
    // -----------------------------------------

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
      res.status(404).json({
        success: false,
        message: "Dataset not found.",
      });
      return;
    }

    if (dataset.status !== "ready") {
      res.status(409).json({
        success: false,
        message: "Dataset must be ready before model training.",
      });
      return;
    }

    // -----------------------------------------
    // 6. Locate and read CSV
    // -----------------------------------------

    const filePath = path.resolve(
      process.cwd(),
      "uploads",
      "datasets",
      path.basename(dataset.storage_key),
    );

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: "The dataset file could not be found.",
      });
      return;
    }

    const rows = await loadDatasetRows(filePath);

    if (rows.length < 10) {
      res.status(400).json({
        success: false,
        message: "At least 10 CSV data rows are required.",
      });
      return;
    }

    const columns = Object.keys(rows[0] ?? {});

    if (!columns.includes(targetColumn)) {
      res.status(400).json({
        success: false,
        message: "Target column does not exist in the CSV.",
        availableColumns: columns,
      });
      return;
    }

    // -----------------------------------------
    // 7. Create PostgreSQL training job
    // -----------------------------------------

    const job = await createTrainingJob({
      organizationId,
      datasetId: dataset.id,
      userId,
      task,
      targetColumn,
      testSize,
      algorithm,
    });

    // -----------------------------------------
    // 8. Run Python ML training in background
    // -----------------------------------------

    const runJob = async (): Promise<void> => {
      const startedAt = new Date();

      try {
        await updateTrainingJobStatus(organizationId, job.id, "running", {
          resultSummary: {
            dataset_id: dataset.id,
            target_column: targetColumn,
            task,
            algorithm,
            test_size: testSize,
            source_model_id: sourceModel?.id ?? null,
          },
          startedAt,
        });

        // Python owns training and artifact storage.
        const result = await trainPythonModel({
          rows,
          target_column: targetColumn,
          task,
          algorithm,
          test_size: testSize,
        });

        if (
          !result ||
          typeof result.model_id !== "string" ||
          !uuidSchema.safeParse(result.model_id).success
        ) {
          throw new Error("Python ML service did not return a valid model ID.");
        }

        // -----------------------------------------
        // 9. Register model or create a new version
        // -----------------------------------------

        const modelInput = {
          organizationId,
          analysisJobId: job.id,
          name: `${dataset.name} ${task} model`,
          algorithm: result.algorithm ?? algorithm,
          taskType: task,
          metrics: (result.metrics ?? {}) as Record<string, number>,
          artifactKey: result.model_id,
        };

        const model = sourceModel
          ? await createModelVersionRecord({
              ...modelInput,
              sourceModelId: sourceModel.id,
            })
          : await createModelRecord(modelInput);

        // -----------------------------------------
        // 10. Mark training job completed
        // -----------------------------------------

        await updateTrainingJobStatus(organizationId, job.id, "completed", {
          resultSummary: {
            dataset_id: dataset.id,
            target_column: targetColumn,
            task,
            algorithm: result.algorithm ?? algorithm,
            test_size: testSize,

            python_model_id: result.model_id,

            model_record_id: model.id,
            model_family_id: model.model_family_id,
            model_version: model.version,

            source_model_id: sourceModel?.id ?? null,

            metrics: result.metrics ?? {},
            total_rows: result.total_rows,
            training_rows: result.training_rows,
            testing_rows: result.testing_rows,
            sample_predictions: result.sample_predictions ?? [],
          },
          startedAt,
          finishedAt: new Date(),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Model training failed.";

        console.error("Background ML training failed:", error);

        try {
          await updateTrainingJobStatus(organizationId, job.id, "failed", {
            resultSummary: {
              dataset_id: dataset.id,
              target_column: targetColumn,
              task,
              algorithm,
              test_size: testSize,
              source_model_id: sourceModel?.id ?? null,
            },
            errorMessage: message,
            startedAt,
            finishedAt: new Date(),
          });
        } catch (statusError) {
          console.error(
            "Unable to update failed training job status:",
            statusError,
          );
        }
      }
    };

    // Do not wait for Python training before returning HTTP 202.
    void runJob();

    // -----------------------------------------
    // 11. Return accepted training job
    // -----------------------------------------

    res.status(202).json({
      success: true,
      message: "Training job started.",
      job: {
        id: job.id,
        status: job.status,
        organizationId,
        datasetId: dataset.id,
        targetColumn,
        task,
        algorithm,
        testSize,
        sourceModelId: sourceModel?.id ?? null,
        createdAt: job.created_at,
      },
    });
  } catch (error) {
    console.error("ML training failed:", error);

    const message = error instanceof Error ? error.message : "";

    if (message.includes("aborted") || message.includes("timeout")) {
      res.status(504).json({
        success: false,
        message: "Python ML service timed out.",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Unable to start model training.",
    });
  }
}
