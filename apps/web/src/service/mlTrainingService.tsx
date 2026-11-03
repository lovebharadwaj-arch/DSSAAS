import { apiRequest } from "../lib/api";

export type MLTask = "classification" | "regression";

// ---------------------------------------------
// Dataset types
// ---------------------------------------------

export interface DatasetOption {
  id: string;
  name: string;
  status: string;
}

export interface DatasetPreview {
  datasetId: string;
  columns: string[];
  rows: Record<string, string | null>[];
  rowCount: number;
  limit: number;
  hasMore: boolean;
}

// ---------------------------------------------
// ML Training types
// ---------------------------------------------

export interface MLSamplePrediction {
  actual: unknown;
  predicted: unknown;
}

export interface MLTrainingResult {
  task: MLTask;
  algorithm: string;
  target_column: string;
  total_rows?: number;
  training_rows?: number;
  testing_rows?: number;
  metrics: Record<string, number>;
  sample_predictions?: MLSamplePrediction[];
}

export interface MLTrainingResponse {
  message: string;
  datasetId: string;
  result: MLTrainingResult;
}

// ---------------------------------------------
// Training job types
// ---------------------------------------------

export interface TrainingJobSummary {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  parameters?: Record<string, unknown>;
  result_summary?: Record<string, unknown>;
  error_message?: string | null;
}

interface TrainingJobAcceptedResponse {
  success: boolean;
  message: string;
  job: {
    id: string;
    status: string;
  };
}

// ---------------------------------------------
// Model registry types
// ---------------------------------------------

export interface MLModelSummary {
  id: string;
  name: string;
  algorithm: string;
  task_type: string;
  status: string;
  metrics?: Record<string, number>;
  artifact_key?: string | null;
  created_at: string;
}

// ---------------------------------------------
// Helpers
// ---------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

// ---------------------------------------------
// Dataset API
// ---------------------------------------------

export function getDatasets(organizationId: string, token: string) {
  return apiRequest<DatasetOption[]>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets`,
    token,
  );
}

export function getDatasetPreview(
  organizationId: string,
  datasetId: string,
  token: string,
) {
  return apiRequest<DatasetPreview>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets/${encodeURIComponent(datasetId)}/preview?limit=10`,
    token,
  );
}

// ---------------------------------------------
// Training jobs API
// ---------------------------------------------

export function listTrainingJobs(organizationId: string, token: string) {
  return apiRequest<{ jobs: TrainingJobSummary[] }>(
    `/organizations/${encodeURIComponent(organizationId)}/models/jobs`,
    token,
  );
}

// ---------------------------------------------
// ML Training API
// ---------------------------------------------

export async function trainDatasetModel(
  organizationId: string,
  datasetId: string,
  token: string,
  input: {
    targetColumn: string;
    task: MLTask;
    testSize: number;
  },
): Promise<MLTrainingResponse> {
  // 1. Start background training.
  const accepted = await apiRequest<TrainingJobAcceptedResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets/${encodeURIComponent(datasetId)}/train`,
    token,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  if (!accepted?.success || !accepted.job?.id) {
    throw new Error("Training API did not return a valid training job.");
  }

  const jobId = accepted.job.id;

  // 2. Poll the job until completion.
  const timeout = 10 * 60 * 1000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    await delay(2000);

    const response = await listTrainingJobs(organizationId, token);

    if (!Array.isArray(response.jobs)) {
      throw new Error("Invalid training jobs response.");
    }

    const job = response.jobs.find((item) => item.id === jobId);

    if (!job) {
      throw new Error("Training job could not be found.");
    }

    // 3. Training failed.
    if (job.status === "failed") {
      throw new Error(job.error_message || "Python model training failed.");
    }

    // 4. Training completed.
    if (job.status === "completed") {
      const summary = job.result_summary;

      if (!isRecord(summary)) {
        throw new Error(
          "Training completed, but the result summary is missing.",
        );
      }

      const algorithm =
        typeof summary.algorithm === "string" ? summary.algorithm : null;

      const targetColumn =
        typeof summary.target_column === "string"
          ? summary.target_column
          : null;

      if (!algorithm || !targetColumn) {
        throw new Error(
          "Training completed, but algorithm or target column is missing.",
        );
      }

      return {
        message: "Model training completed successfully.",
        datasetId,
        result: {
          task: input.task,
          algorithm,
          target_column: targetColumn,
          total_rows: getNumber(summary.total_rows),
          training_rows: getNumber(summary.training_rows),
          testing_rows: getNumber(summary.testing_rows),
          metrics: isRecord(summary.metrics)
            ? (summary.metrics as Record<string, number>)
            : {},
          sample_predictions: Array.isArray(summary.sample_predictions)
            ? (summary.sample_predictions as MLSamplePrediction[])
            : [],
        },
      };
    }
  }

  throw new Error("Model training timed out. Check the training jobs page.");
}

// ---------------------------------------------
// Model registry API
// ---------------------------------------------

export function listModels(organizationId: string, token: string) {
  return apiRequest<{ models: MLModelSummary[] }>(
    `/organizations/${encodeURIComponent(organizationId)}/models`,
    token,
  );
}

// ---------------------------------------------
// Model prediction API
// ---------------------------------------------

export function predictModel(
  organizationId: string,
  modelId: string,
  token: string,
  input: {
    input_data: Record<string, unknown>;
  },
) {
  return apiRequest<{
    prediction: unknown;
    modelId: string;
  }>(
    `/organizations/${encodeURIComponent(organizationId)}/models/${encodeURIComponent(modelId)}/predict`,
    token,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
