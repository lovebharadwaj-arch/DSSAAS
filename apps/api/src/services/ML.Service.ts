const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000";

export interface TrainModelInput {
  rows: Record<string, unknown>[];
  target_column: string;
  task: "classification" | "regression";
  algorithm: string;
  test_size?: number;
}

export interface PredictModelInput {
  model_id: string;
  input_data: Record<string, unknown>;
}

async function callMLService(endpoint: string, input: object) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.ML_SERVICE_TIMEOUT_MS ?? 120000),
  );

  try {
    const response = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("FastAPI ML Service Error:", {
        status: response.status,
        endpoint,
        response: result,
      });

      const message =
        typeof result?.detail === "string"
          ? result.detail
          : typeof result?.message === "string"
            ? result.message
            : `Python ML service failed with status ${response.status}.`;

      throw new Error(message);
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export function trainPythonModel(input: TrainModelInput) {
  return callMLService("/models/train", input);
}

export function predictPythonModel(input: PredictModelInput) {
  return callMLService("/models/predict", input);
}

async function getMLService(endpoint: string) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.ML_SERVICE_TIMEOUT_MS ?? 120000),
  );

  try {
    const response = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("FastAPI ML Service Error:", {
        status: response.status,
        endpoint,
        response: result,
      });

      const message =
        typeof result?.detail === "string"
          ? result.detail
          : typeof result?.message === "string"
            ? result.message
            : `Python ML service failed with status ${response.status}.`;

      throw new Error(message);
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export function getPythonModelSchema(modelId: string) {
  return getMLService(`/models/${encodeURIComponent(modelId)}/schema`);
}

export interface MLArtifactStatus {
  success: boolean;
  model_id: string;
  artifact: {
    exists: boolean;
    filename: string | null;
    size_bytes: number | null;
  };
  schema: {
    exists: boolean;
    filename: string | null;
    size_bytes: number | null;
  };
  complete: boolean;
}

export async function getPythonModelArtifactStatus(
  modelId: string,
): Promise<MLArtifactStatus> {
  const response = await fetch(
    `${ML_SERVICE_URL}/models/${encodeURIComponent(modelId)}/artifacts/status`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `ML artifact status failed (${response.status}): ${errorText}`,
    );
  }

  return response.json() as Promise<MLArtifactStatus>;
}
