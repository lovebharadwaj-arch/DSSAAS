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
      const message =
        typeof result?.detail === "string"
          ? result.detail
          : "Python ML service failed.";

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
