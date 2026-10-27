import { parse } from "csv-parse/sync";
import type { Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import { createDataset } from "../services/datasetUpload.service.ts";

const organizationIdSchema = z.string().uuid();

function escapeCsvField(value: unknown): string {
  const text = value == null ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function serializeCsv(records: string[][]): string {
  return `${records
    .map((row) => row.map((cell) => escapeCsvField(cell)).join(","))
    .join("\n")}\n`;
}

function makeUniqueHeaders(headers: string[]): string[] {
  const used = new Set<string>();

  return headers.map((header) => {
    const baseName = header.trim() || "column";
    let candidate = baseName;
    let suffix = 2;

    while (used.has(candidate.toLowerCase())) {
      candidate = `${baseName}_${suffix}`;
      suffix += 1;
    }

    used.add(candidate.toLowerCase());
    return candidate;
  });
}

async function removeTemporaryFile(filePath?: string): Promise<void> {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code !== "ENOENT"
    ) {
      console.error("Unable to remove uploaded file:", error);
    }
  }
}

export async function uploadDatasetHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const file = req.file;
  const userId = (req as AuthenticatedRequest).user?.id;
  const organizationId = req.params.organizationId;

  if (!userId) {
    await removeTemporaryFile(file?.path);

    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (
    typeof organizationId !== "string" ||
    !organizationIdSchema.safeParse(organizationId).success
  ) {
    await removeTemporaryFile(file?.path);

    res.status(400).json({
      success: false,
      message: "Invalid organization ID.",
    });
    return;
  }

  if (!file) {
    res.status(400).json({
      success: false,
      message: 'Upload a CSV file using the form field "file".',
    });
    return;
  }

  try {
    const csvText = await fs.readFile(file.path, "utf8");

    const records: string[][] = parse(csvText, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
      max_record_size: 1024 * 1024,
    });

    if (records.length === 0 || records[0].length === 0) {
      res.status(400).json({
        success: false,
        message: "The CSV file is empty or has no header row.",
      });
      await removeTemporaryFile(file.path);
      return;
    }

    const headers = records[0].map((header) => header.trim());

    if (headers.length > 200) {
      res.status(400).json({
        success: false,
        message: "CSV files may contain at most 200 columns.",
      });
      await removeTemporaryFile(file.path);
      return;
    }

    if (headers.some((header) => header.length === 0)) {
      res.status(400).json({
        success: false,
        message: "Every CSV column must have a non-empty header.",
      });
      await removeTemporaryFile(file.path);
      return;
    }

    const uniqueHeaders = makeUniqueHeaders(headers);
    const hasDuplicateHeaders =
      uniqueHeaders.length !== headers.length ||
      headers.some((header, index) => {
        const normalized = header.trim().toLowerCase();
        return (
          headers.findIndex(
            (candidate) => candidate.trim().toLowerCase() === normalized,
          ) !== index
        );
      });

    if (hasDuplicateHeaders) {
      records[0] = uniqueHeaders;
      await fs.writeFile(file.path, serializeCsv(records), "utf8");
    }

    const finalHeaders = hasDuplicateHeaders ? uniqueHeaders : headers;
    const rowCount = records.length - 1;

    const nameSchema = z.string().trim().min(1).max(255);
    const nameValidation = nameSchema.safeParse(
      typeof req.body?.name === "string" ? req.body.name : "",
    );

    if (!nameValidation.success) {
      res.status(400).json({
        success: false,
        message: "Provide a dataset name between 1 and 255 characters.",
      });
      await removeTemporaryFile(file.path);
      return;
    }

    let description: string | undefined;

    if (req.body?.description !== undefined) {
      if (
        typeof req.body.description !== "string" ||
        req.body.description.length > 5000
      ) {
        res.status(400).json({
          success: false,
          message: "Description must be text with at most 5000 characters.",
        });
        await removeTemporaryFile(file.path);
        return;
      }

      description = req.body.description.trim() || undefined;
    }

    const dataset = await createDataset({
      organizationId,
      userId,
      name: nameValidation.data,
      description,
      originalFilename: path.basename(file.originalname).slice(0, 255),
      mimeType: file.mimetype || "text/csv",
      fileSizeBytes: file.size,
      filePath: file.path,
      schemaSnapshot: {
        columns: finalHeaders,
        rowCount,
      },
    });

    res.status(201).json({
      success: true,
      message: "Dataset uploaded and validated successfully.",
      data: {
        ...dataset,
        row_count: rowCount,
        column_count: finalHeaders.length,
      },
    });
  } catch (error) {
    await removeTemporaryFile(file.path);

    if (error instanceof Error && "code" in error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        res.status(400).json({
          success: false,
          message: "Uploaded file could not be read.",
        });
        return;
      }
    }

    console.error("Dataset upload failed:", error);

    res.status(400).json({
      success: false,
      message: "The CSV file is invalid or could not be processed.",
    });
  }
}
