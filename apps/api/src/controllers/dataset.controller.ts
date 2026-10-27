import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import {
  deleteDataset,
  getDatasetById,
  listDatasets,
} from "../services/dataset.service.ts";

const uuidSchema = z.string().uuid();

function getIdentity(
  req: Request,
  res: Response,
): { userId: string; organizationId: string } | null {
  const userId = (req as AuthenticatedRequest).user?.id;
  const organizationId = req.params.organizationId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return null;
  }

  if (
    typeof organizationId !== "string" ||
    !uuidSchema.safeParse(organizationId).success
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid organization ID.",
    });
    return null;
  }

  return { userId, organizationId };
}

export async function listDatasetsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const identity = getIdentity(req, res);
  if (!identity) return;

  const limitResult = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .safeParse(req.query.limit ?? "20");
  const offsetResult = z.coerce
    .number()
    .int()
    .min(0)
    .safeParse(req.query.offset ?? "0");

  if (!limitResult.success || !offsetResult.success) {
    res.status(400).json({
      success: false,
      message: "Limit must be 1–100 and offset must be non-negative.",
    });
    return;
  }

  try {
    const datasets = await listDatasets(
      identity.organizationId,
      limitResult.data,
      offsetResult.data,
    );

    res.status(200).json({
      success: true,
      data: datasets,
      pagination: {
        limit: limitResult.data,
        offset: offsetResult.data,
        count: datasets.length,
      },
    });
  } catch (error) {
    console.error("List datasets failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch datasets.",
    });
  }
}

export async function getDatasetHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const identity = getIdentity(req, res);
  if (!identity) return;

  const datasetId = req.params.datasetId;

  if (
    typeof datasetId !== "string" ||
    !uuidSchema.safeParse(datasetId).success
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid dataset ID.",
    });
    return;
  }

  try {
    const dataset = await getDatasetById(identity.organizationId, datasetId);

    if (!dataset) {
      res.status(404).json({
        success: false,
        message: "Dataset not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    console.error("Get dataset failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch dataset.",
    });
  }
}

export async function deleteDatasetHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const identity = getIdentity(req, res);
  if (!identity) return;

  const datasetId = req.params.datasetId;

  if (
    typeof datasetId !== "string" ||
    !uuidSchema.safeParse(datasetId).success
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid dataset ID.",
    });
    return;
  }

  try {
    const deleted = await deleteDataset(identity.organizationId, datasetId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Dataset not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Dataset deleted successfully.",
    });
  } catch (error) {
    console.error("Delete dataset failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to delete dataset.",
    });
  }
}
