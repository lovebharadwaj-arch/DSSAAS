export interface CsvCheckResult {
  filename: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary?: {
    rows: number;
    columns: number;
    column_names: string[];
    missing_values: number;
    duplicate_rows: number;
  };
}

const ML_API_URL = import.meta.env.VITE_ML_API_URL ?? "http://127.0.0.1:8000";

export async function checkCsvFile(
  file: File,
  token?: string,
): Promise<CsvCheckResult> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${ML_API_URL}/api/files/check-csv`, {
    method: "POST",
    headers,
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "CSV validation failed.",
    );
  }

  return result as CsvCheckResult;
}
