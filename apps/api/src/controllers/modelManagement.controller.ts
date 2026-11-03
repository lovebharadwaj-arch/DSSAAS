import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import { predictPythonModel } from "../services/ML.Service.ts";
import {
  getModelForOrganization,
  listModelsForOrganization,
  listTrainingJobs,
} from "../services/mlJob.service.ts";

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

export async function listOrganizationJobsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const identity = getIdentity(req, res);
  if (!identity) return;

  try {
    const jobs = await listTrainingJobs(identity.organizationId);

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("List training jobs failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch training jobs.",
    });
  }
}

export async function listOrganizationModelsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const identity = getIdentity(req, res);
  if (!identity) return;

  try {
    const models = await listModelsForOrganization(identity.organizationId);

    res.status(200).json({
      success: true,
      models,
    });
  } catch (error) {
    console.error("List organization models failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch models.",
    });
  }
}

export async function predictOrganizationModelHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const identity = getIdentity(req, res);
  if (!identity) return;

  const modelId = req.params.modelId;
  if (typeof modelId !== "string" || !uuidSchema.safeParse(modelId).success) {
    res.status(400).json({
      success: false,
      message: "Invalid model ID.",
    });
    return;
  }

  try {
    const model = await getModelForOrganization(
      identity.organizationId,
      modelId,
    );

    if (!model) {
      res.status(404).json({
        success: false,
        message: "Model not found.",
      });
      return;
    }

    const input = req.body ?? {};
    if (
      input === null ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      !Object.keys(input).length
    ) {
      res.status(400).json({
        success: false,
        message: "A non-empty prediction payload is required.",
      });
      return;
    }

    const pythonModelId = model.artifact_key;

    if (
      typeof pythonModelId !== "string" ||
      !uuidSchema.safeParse(pythonModelId).success
    ) {
      res.status(404).json({
        success: false,
        message: "This model does not have a valid saved artifact.",
      });
      return;
    }

    const prediction = await predictPythonModel({
      model_id: pythonModelId,
      input_data: input,
    });

    res.status(200).json({
      success: true,
      modelId: model.id,
      modelName: model.name,
      prediction: prediction.prediction,
    });
  } catch (error) {
    console.error("Prediction failed:", error);

    const message =
      error instanceof Error ? error.message : "Prediction failed.";

    if (message.includes("not found")) {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    res.status(502).json({
      success: false,
      message,
    });
  }
}
