import { apiRequest } from "../lib/api";

export interface DatasetOption {
  id: string;
  name: string;
  status: string;
  original_filename?: string;
}

interface DatasetListResponse {
  success?: boolean;
  data?:
    | DatasetOption[]
    | {
        datasets?: DatasetOption[];
      };
  datasets?: DatasetOption[];
}

export async function getOrganizationDatasets(
  token: string,
  organizationId: string,
): Promise<DatasetOption[]> {
  const response = await apiRequest<DatasetListResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets`,
    token,
  );

  // Adjust this normalization if your existing API uses a different response shape.
  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && "datasets" in response.data) {
    return response.data.datasets ?? [];
  }

  return response.datasets ?? [];
}
