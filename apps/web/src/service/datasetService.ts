import { apiRequest } from "../lib/api";
import type {
  DatasetPreviewData,
  DatasetProfile,
  PreviewResponse,
  ProfileApiResponse,
} from "../types";

export interface DatasetRecord {
  id: string;
  organization_id?: string;
  name?: string;
  description?: string;
  original_filename?: string;
  row_count?: number;
  column_count?: number;
  file_size_bytes?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatasetListResponse {
  success: boolean;
  message?: string;
  data: DatasetRecord[];
}

export async function listDatasets(
  token: string,
  organizationId: string,
): Promise<DatasetRecord[]> {
  const result = await apiRequest<DatasetListResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets`,
    token,
  );

  return result.data ?? [];
}

export async function uploadDataset(
  token: string,
  organizationId: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", file.name);

  await apiRequest<{ message: string }>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets`,
    token,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function previewDataset(
  token: string,
  organizationId: string,
  datasetId: string,
  limit = 20,
): Promise<DatasetPreviewData> {
  const result = await apiRequest<PreviewResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets/${encodeURIComponent(datasetId)}/preview?limit=${limit}`,
    token,
  );

  return result.data;
}

export async function profileDataset(
  token: string,
  organizationId: string,
  datasetId: string,
): Promise<DatasetProfile> {
  const result = await apiRequest<ProfileApiResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets/${encodeURIComponent(datasetId)}/profile`,
    token,
    { method: "POST" },
  );

  return result.data;
}

export async function deleteDataset(
  token: string,
  organizationId: string,
  datasetId: string,
): Promise<void> {
  await apiRequest<{ message: string }>(
    `organizations/${encodeURIComponent(organizationId)}/datasets/${encodeURIComponent(datasetId)}`,
    token,
    {
      method: "DELETE",
    },
  );
}
