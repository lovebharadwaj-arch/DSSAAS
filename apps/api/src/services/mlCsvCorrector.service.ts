import axios from "axios";
import FormData from "form-data";

export interface CsvCorrectionOptions {
  delimiter?: string;
  hasHeader?: boolean;
  trimWhitespace?: boolean;
  normalizeColumns?: boolean;
  removeDuplicates?: boolean;
}

export interface CsvCorrectionResponse {
  filename: string;
  corrected_filename: string;
  report: {
    valid: boolean;
    [key: string]: unknown;
  };
  corrected_csv: string;
}

const mlServiceUrl = (
  process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const timeoutMs = Number(process.env.ML_SERVICE_TIMEOUT_MS ?? 120000);

export async function correctCsvWithPython(
  file: Express.Multer.File,
  options: CsvCorrectionOptions = {},
): Promise<CsvCorrectionResponse> {
  const form = new FormData();

  form.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype || "text/csv",
    knownLength: file.size,
  });

  if (options.delimiter) {
    form.append("delimiter", options.delimiter);
  }

  form.append("has_header", String(options.hasHeader ?? true));
  form.append("trim_whitespace", String(options.trimWhitespace ?? true));
  form.append("normalize_columns", String(options.normalizeColumns ?? true));
  form.append("remove_duplicates", String(options.removeDuplicates ?? false));

  try {
    const response = await axios.post<CsvCorrectionResponse>(
      `${mlServiceUrl}/api/csv/correct`,
      form,
      {
        headers: form.getHeaders(),
        timeout: timeoutMs,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNREFUSED") {
        throw new Error("The Python ML service is unavailable.");
      }

      if (error.code === "ECONNABORTED") {
        throw new Error("CSV processing timed out.");
      }

      if (error.response?.status === 422) {
        throw new Error(
          typeof error.response.data?.detail === "string"
            ? error.response.data.detail
            : "The CSV could not be processed.",
        );
      }

      if (error.response?.status === 413) {
        throw new Error("The CSV exceeds the Python service size limit.");
      }
    }

    throw error;
  }
}
