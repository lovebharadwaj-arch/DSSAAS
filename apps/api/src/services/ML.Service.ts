const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000";

export interface TrainModelInput {
  rows: Record<string, unknown>[];
  target_column: string;
  task: "classification" | "regression";
  test_size?: number;
  artifact_path?: string;
}

export interface PredictModelInput {
  model_path: string;
  input_data: Record<string, unknown>;
}

export async function trainPythonModel(input: TrainModelInput) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => {
      controller.abort();
    },
    Number(process.env.ML_SERVICE_TIMEOUT_MS ?? 120000),
  );

  try {
    const response = await fetch(`${ML_SERVICE_URL}/models/train`, {
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

export async function predictPythonModel(input: PredictModelInput) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.ML_SERVICE_TIMEOUT_MS ?? 120000),
  );

  try {
    const response = await fetch(`${ML_SERVICE_URL}/models/predict`, {
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
