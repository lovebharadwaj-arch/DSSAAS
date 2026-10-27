import { apiRequest } from "../lib/api";

export type MissingValueStrategy = "keep" | "drop_rows" | "fill_empty";

export interface CleaningOptions {
  removeDuplicates: boolean;
  missingValues: MissingValueStrategy;
}

export interface CleaningPreview {
  datasetId: string;
  columns: string[];
  originalRowCount: number;
  cleanedRowCount: number;
  duplicatesRemoved: number;
  rowsWithMissingValues: number;
  preview: string[][];
}

interface CleaningPreviewResponse {
  success: boolean;
  message: string;
  data: CleaningPreview;
}

export interface SavedCleanedVersion {
  id: string;
  dataset_id: string;
  version_number: number;
  storage_key: string;
  file_size_bytes: number;
  schema_snapshot: Record<string, unknown>;
  created_at: string;
  originalRowCount: number;
  cleanedRowCount: number;
  rowsRemoved: number;
}

export interface SaveCleanedVersionResponse {
  success: boolean;
  message: string;
  data: SavedCleanedVersion;
}

export async function previewDataCleaning(
  organizationId: string,
  datasetId: string,
  token: string,
  options: CleaningOptions,
): Promise<CleaningPreview> {
  const response = await apiRequest<CleaningPreviewResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets/${encodeURIComponent(datasetId)}/clean/preview`,
    token,
    {
      method: "POST",
      body: JSON.stringify(options),
    },
  );

  return response.data;
}

export async function saveCleanedDatasetVersion(
  organizationId: string,
  datasetId: string,
  token: string,
  options: CleaningOptions,
): Promise<SaveCleanedVersionResponse> {
  return apiRequest<SaveCleanedVersionResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets/${encodeURIComponent(datasetId)}/clean/save`,
    token,
    {
      method: "POST",
      body: JSON.stringify(options),
    },
  );
}
