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

  // Normalize the URL so the slash between /api and the endpoint is correct.
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  const url = `${baseUrl}/${normalizedEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle responses with no content, such as HTTP 204.
  if (response.status === 204) {
    if (!response.ok) {
      throw new Error("Request failed");
    }

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
