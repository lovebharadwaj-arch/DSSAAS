const ML_API_URL = import.meta.env.VITE_ML_API_URL ?? "http://127.0.0.1:8000";

export interface CsvCorrectionResult {
  filename: string;
  valid: boolean;
  summary: {
    original_rows: number;
    corrected_rows: number;
    columns: number;
    duplicates_removed: number;
    missing_values_remaining: number;
  };
  changes: Array<Record<string, string | number>>;
  corrected_csv: string;
}

export async function correctCsvFile(
  file: File,
  options?: {
    trimWhitespace?: boolean;
    standardizeText?: boolean;
    removeDuplicates?: boolean;
    missingStrategy?: "none" | "empty" | "mean" | "median" | "mode";
  },
): Promise<CsvCorrectionResult> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("trim_whitespace", String(options?.trimWhitespace ?? true));
  formData.append(
    "standardize_text",
    String(options?.standardizeText ?? false),
  );
  formData.append(
    "remove_duplicates",
    String(options?.removeDuplicates ?? true),
  );
  formData.append("missing_strategy", options?.missingStrategy ?? "none");

  let response: Response;

  try {
    response = await fetch(`${ML_API_URL}/api/files/correct-csv`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(`Cannot connect to the Python service at ${ML_API_URL}.`);
  }

  const body = await response.json();
  if (!response.ok) {
    console.error("CSV correction error:", body);
    throw new Error(JSON.stringify(body.detail ?? body));
  }

  return body as CsvCorrectionResult;
}

export function downloadCorrectedCsv(filename: string, content: string) {
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `corrected_${filename}`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
