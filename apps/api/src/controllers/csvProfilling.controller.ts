import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import { profileCsvDataset } from "../services/csvProffiling.service.ts";

const uuidSchema = z.string().uuid();

export async function profileDatasetHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user?.id;
  const organizationId = req.params.organizationId;
  const datasetId = req.params.datasetId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

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

  try {
    const profile = await profileCsvDataset(organizationId, datasetId);

    res.status(200).json({
      success: true,
      message: "Dataset profiling completed.",
      data: profile,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DATASET_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Dataset not found.",
      });
      return;
    }

    if (
      error instanceof Error &&
      ["EMPTY_CSV", "INVALID_CSV"].includes(error.message)
    ) {
      res.status(400).json({
        success: false,
        message: "The CSV file is empty or invalid.",
      });
      return;
    }

    console.error("Dataset profiling failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to profile this dataset.",
    });
  }
}
