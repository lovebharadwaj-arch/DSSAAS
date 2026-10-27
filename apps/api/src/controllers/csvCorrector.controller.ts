import type { Request, Response, NextFunction } from "express";
import {
  correctCsvWithPython,
  type CsvCorrectionOptions,
} from "../services/mlCsvCorrector.service.ts";

function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;

  throw new Error("Boolean options must be true or false.");
}

export async function correctCsvUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please upload a CSV file using the 'file' field.",
      });
      return;
    }

    const delimiter = req.body.delimiter as string | undefined;

    if (delimiter !== undefined && ![",", "\t", ";", "|"].includes(delimiter)) {
      res.status(400).json({
        success: false,
        message: "Delimiter must be comma, tab, semicolon, or pipe.",
      });
      return;
    }

    const options: CsvCorrectionOptions = {
      delimiter,
      hasHeader: parseBoolean(req.body.has_header, true),
      trimWhitespace: parseBoolean(req.body.trim_whitespace, true),
      normalizeColumns: parseBoolean(req.body.normalize_columns, true),
      removeDuplicates: parseBoolean(req.body.remove_duplicates, false),
    };

    const result = await correctCsvWithPython(req.file, options);

    res.status(200).json({
      success: true,
      message: "CSV processed successfully.",
      originalFilename: req.file.originalname,
      correctedFilename: result.corrected_filename,
      report: result.report,
      correctedCsv: result.corrected_csv,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.message.startsWith("Boolean options") ||
        error.message.startsWith("The CSV exceeds") ||
        error.message.startsWith("The CSV could not") ||
        error.message.startsWith("Only ")
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message === "The Python ML service is unavailable.") {
        res.status(503).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message === "CSV processing timed out.") {
        res.status(504).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    next(error);
  }
}
