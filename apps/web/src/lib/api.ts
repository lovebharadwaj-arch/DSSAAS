import type {
  MLArtifactStatusResponse,
  MLLatestVersionResponse,
  MLModelVersionsResponse,
} from "../service/mlTrainingService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiRequest<T>(
  endpoint: string,
  token?: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  const url = `${baseUrl}/${normalizedEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");

  const result = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof result === "object" && result !== null && "message" in result
        ? String(result.message)
        : typeof result === "string" && result
          ? result
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return result as T;
}

export async function getModelArtifactStatus(
  organizationId: string,
  modelId: string,
): Promise<MLArtifactStatusResponse> {
  return apiRequest<MLArtifactStatusResponse>(
    `/organizations/${organizationId}/models/${modelId}/artifacts/status`,
  );
}

// ---------------------------------------------
// Model version history API
// ---------------------------------------------

export async function listModelVersions(
  organizationId: string,
  modelId: string,
  token: string,
): Promise<MLModelVersionsResponse> {
  const response = await apiRequest<MLModelVersionsResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/models/${encodeURIComponent(modelId)}/versions`,
    token,
  );

  if (!response.success || !Array.isArray(response.versions)) {
    throw new Error("Unable to retrieve model versions.");
  }

  return response;
}

// ---------------------------------------------
// Latest model version API
// ---------------------------------------------

export async function getLatestModelVersion(
  organizationId: string,
  modelId: string,
  token: string,
): Promise<MLLatestVersionResponse> {
  const response = await apiRequest<MLLatestVersionResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/models/${encodeURIComponent(modelId)}/latest`,
    token,
  );

  if (!response.success || !response.model) {
    throw new Error("Unable to retrieve the latest model version.");
  }

  return response;
}
