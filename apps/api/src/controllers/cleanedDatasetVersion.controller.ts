import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import { saveCleanedDatasetVersion } from "../services/cleanedDatasetVersion.service.ts";

const uuidSchema = z.string().uuid();

const optionsSchema = z.object({
  removeDuplicates: z.boolean().default(false),
  missingValues: z.enum(["keep", "drop_rows", "fill_empty"]).default("keep"),
});

export async function saveCleanedDatasetVersionHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const organizationId = String(req.params.organizationId ?? "");
  const datasetId = String(req.params.datasetId ?? "");

  const organizationValidation = uuidSchema.safeParse(organizationId);
  const datasetValidation = uuidSchema.safeParse(datasetId);
  const optionsValidation = optionsSchema.safeParse(req.body ?? {});

  if (!organizationValidation.success || !datasetValidation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid organization ID or dataset ID.",
    });
  }

  if (!optionsValidation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid cleaning options.",
      errors: optionsValidation.error.flatten(),
    });
  }

  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  try {
    const version = await saveCleanedDatasetVersion(
      organizationId,
      datasetId,
      userId,
      optionsValidation.data,
    );

    return res.status(201).json({
      success: true,
      message: "Cleaned dataset version saved successfully.",
      data: version,
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

    console.error("Save cleaned dataset version error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save cleaned dataset version.",
    });
  }
}
