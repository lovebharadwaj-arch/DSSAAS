import type { Request, Response } from "express";
import { z } from "zod";
import {
  saveDatasetProfile,
  getDatasetProfile,
  deleteDatasetProfile,
} from "../services/datasetProfile.service.ts";

const columnSchema = z.object({
  name: z.string().min(1).max(200),
  dataType: z.string().min(1).max(100),
  missingCount: z.number().int().min(0),
  uniqueCount: z.number().int().min(0),
  statistics: z.record(z.string(), z.unknown()).optional(),
});

const profileSchema = z
  .object({
    datasetId: z.string().uuid(),
    organizationId: z.string().uuid(),
    rowCount: z.number().int().min(0),
    columnCount: z.number().int().min(0),
    duplicateCount: z.number().int().min(0),
    columns: z.array(columnSchema),
  })
  .refine((data) => data.columnCount === data.columns.length, {
    message: "columnCount must match the number of columns",
  });

export async function createOrUpdateDatasetProfile(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const parsed = profileSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid dataset profile",
        errors: parsed.error.issues,
      });
      return;
    }

    const profile = await saveDatasetProfile(parsed.data);

    res.status(200).json({
      success: true,
      message: "Dataset profile saved successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Save dataset profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save dataset profile",
    });
  }
}

export async function fetchDatasetProfile(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { datasetId } = req.params;
    const organizationId = req.query.organizationId;

    if (
      typeof datasetId !== "string" ||
      !z.string().uuid().safeParse(datasetId).success ||
      typeof organizationId !== "string" ||
      !z.string().uuid().safeParse(organizationId).success
    ) {
      res.status(400).json({
        success: false,
        message: "Valid datasetId and organizationId are required",
      });
      return;
    }

    const profile = await getDatasetProfile(organizationId, datasetId);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Dataset profile not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Fetch dataset profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dataset profile",
    });
  }
}

export async function removeDatasetProfile(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { datasetId } = req.params;
    const organizationId = req.query.organizationId;

    if (
      typeof datasetId !== "string" ||
      !z.string().uuid().safeParse(datasetId).success ||
      typeof organizationId !== "string" ||
      !z.string().uuid().safeParse(organizationId).success
    ) {
      res.status(400).json({
        success: false,
        message: "Valid datasetId and organizationId are required",
      });
      return;
    }

    const deleted = await deleteDatasetProfile(organizationId, datasetId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Dataset profile not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Dataset profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete dataset profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete dataset profile",
    });
  }
}
