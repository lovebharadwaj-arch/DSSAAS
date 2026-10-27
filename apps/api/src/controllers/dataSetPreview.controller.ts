import type { Request, Response } from "express";
import { z } from "zod";
import { previewDataset } from "../services/datasetPreview.service.ts";

const uuidSchema = z.string().uuid();

export async function previewDatasetHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const organizationId = req.params.organizationId;
  const datasetId = req.params.datasetId;

  const limitResult = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .safeParse(req.query.limit ?? 20);

  if (
    typeof organizationId !== "string" ||
    !uuidSchema.safeParse(organizationId).success ||
    typeof datasetId !== "string" ||
    !uuidSchema.safeParse(datasetId).success
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid organization ID or dataset ID.",
    });
    return;
  }

  if (!limitResult.success) {
    res.status(400).json({
      success: false,
      message: "Limit must be an integer between 1 and 100.",
    });
    return;
  }

  try {
    const data = await previewDataset(
      organizationId,
      datasetId,
      limitResult.data,
    );

    res.status(200).json({
      success: true,
      message: "Dataset preview retrieved successfully.",
      data,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DATASET_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Dataset not found.",
      });
      return;
    }

    if (error instanceof Error && error.message === "EMPTY_CSV") {
      res.status(400).json({
        success: false,
        message: "The CSV file has no header row.",
      });
      return;
    }

    console.error("Dataset preview failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to preview this dataset.",
    });
  }
}
