import { apiRequest } from "../lib/api";

export type MLTask = "classification" | "regression";

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

export interface MLTrainingResponse {
  message: string;
  datasetId: string;
  result: {
    task: MLTask;
    algorithm: string;
    target_column: string;
    total_rows?: number;
    training_rows?: number;
    testing_rows?: number;
    metrics: Record<string, number>;
    sample_predictions?: {
      actual: unknown;
      predicted: unknown;
    }[];
  };
}

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

export function trainDatasetModel(
  organizationId: string,
  datasetId: string,
  token: string,
  input: {
    targetColumn: string;
    task: MLTask;
    testSize: number;
  },
) {
  return apiRequest<MLTrainingResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets/${encodeURIComponent(datasetId)}/train`,
    token,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export interface TrainingJobSummary {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  parameters?: Record<string, unknown>;
  result_summary?: Record<string, unknown>;
}

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

export function listTrainingJobs(organizationId: string, token: string) {
  return apiRequest<{ jobs: TrainingJobSummary[] }>(
    `/organizations/${encodeURIComponent(organizationId)}/models/jobs`,
    token,
  );
}

export function listModels(organizationId: string, token: string) {
  return apiRequest<{ models: MLModelSummary[] }>(
    `/organizations/${encodeURIComponent(organizationId)}/models`,
    token,
  );
}

export function predictModel(
  organizationId: string,
  modelId: string,
  token: string,
  input: { input_data: Record<string, unknown> },
) {
  return apiRequest<{ prediction: unknown; modelId: string }>(
    `/organizations/${encodeURIComponent(organizationId)}/models/${encodeURIComponent(modelId)}/predict`,
    token,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
