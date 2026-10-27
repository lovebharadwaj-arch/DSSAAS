import type { Request, Response } from "express";
import { z } from "zod";
import { previewDataCleaning } from "../services/dataCleaning.service.ts";

const uuidSchema = z.string().uuid();

const cleaningSchema = z.object({
  removeDuplicates: z.boolean().default(false),
  missingValues: z.enum(["keep", "drop_rows", "fill_empty"]).default("keep"),
});

export async function previewDataCleaningHandler(req: Request, res: Response) {
  const organizationId = req.params.organizationId;
  const datasetId = req.params.datasetId;

  const orgValidation = uuidSchema.safeParse(organizationId);
  const datasetValidation = uuidSchema.safeParse(datasetId);
  const bodyValidation = cleaningSchema.safeParse(req.body);

  if (!orgValidation.success || !datasetValidation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid organization or dataset ID.",
    });
  }

  if (!bodyValidation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid cleaning options.",
      errors: bodyValidation.error.flatten(),
    });
  }

  try {
    const data = await previewDataCleaning(
      organizationId,
      datasetId,
      bodyValidation.data,
    );

    return res.status(200).json({
      success: true,
      message: "Cleaning preview generated successfully.",
      data,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DATASET_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Dataset not found.",
        });
      }

      if (error.message === "EMPTY_CSV") {
        return res.status(400).json({
          success: false,
          message: "The CSV file is empty.",
        });
      }

      if (error.message === "INVALID_CSV") {
        return res.status(400).json({
          success: false,
          message: "The CSV structure is invalid.",
        });
      }
    }

    console.error("Cleaning preview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate cleaning preview.",
    });
  }
}
