import { apiRequest } from "../lib/api";

export interface HistogramBin {
  from: number;
  to: number;
  count: number;
}

export interface ColumnDistribution {
  columnName: string;
  dataType: string;
  rowCount: number;
  missingCount: number;
  validCount: number;
  invalidCount?: number;
  uniqueCount?: number;
  histogram?: Array<{
    from: number;
    to: number;
    count: number;
  }>;
  topValues?: Array<{
    value: string;
    count: number;
  }>;
  statistics?: Record<string, number> | null;
  outliers?: {
    count: number;
    lowerBound: number;
    upperBound: number;
  } | null;
}

interface DistributionResponse {
  success: boolean;
  data: ColumnDistribution;
}

export async function fetchColumnDistribution(
  organizationId: string,
  datasetId: string,
  columnName: string,
  token: string,
  bins = 10,
): Promise<ColumnDistribution> {
  const response = await apiRequest<DistributionResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets/${encodeURIComponent(datasetId)}/distribution`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ columnName, bins }),
    },
  );

  return response.data;
}
