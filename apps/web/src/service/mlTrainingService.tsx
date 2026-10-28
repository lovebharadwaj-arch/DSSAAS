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
