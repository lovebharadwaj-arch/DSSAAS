import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import {
  getPythonModelArtifactStatus,
  getPythonModelSchema,
  predictPythonModel,
} from "../services/ML.Service.ts";
import {
  archiveModelForOrganization,
  getLatestModelVersionForOrganization,
  getModelDetailsForOrganization,
  getModelForOrganization,
  listModelVersionsForOrganization,
  listModelsForOrganization,
  listTrainingJobs,
  promoteModelVersionForOrganization,
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

  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const status = req.query.status ? String(req.query.status) : undefined;

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid pagination parameters.",
    });
    return;
  }

  const allowedStatuses = ["queued", "running", "completed", "failed"];

  if (status && !allowedStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: "Invalid training job status.",
    });
    return;
  }

  try {
    const result = await listTrainingJobs(identity.organizationId, {
      page,
      limit,
      status,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Training history failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve training history.",
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

    if (model.status === "archived") {
      res.status(409).json({
        success: false,
        message: "Archived model versions cannot be used for prediction.",
      });
      return;
    }

    const input = req.body?.input_data ?? {};
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

export async function getOrganizationModelSchemaHandler(
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
    // 1. Find the model inside the user's organization.
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

    // 2. Get the Python artifact UUID from PostgreSQL.
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

    // 3. Ask Python FastAPI for the saved feature schema.
    const schema = await getPythonModelSchema(pythonModelId);

    // 4. Return schema to React.
    res.status(200).json({
      success: true,
      modelId: model.id,
      modelName: model.name,
      schema,
    });
  } catch (error) {
    console.error("Get model schema failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve model schema.";

    if (message.toLowerCase().includes("not found")) {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    res.status(502).json({
      success: false,
      message: "Unable to retrieve schema from Python ML service.",
    });
  }
}

export async function archiveOrganizationModelHandler(
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
    const model = await archiveModelForOrganization(
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

    res.status(200).json({
      success: true,
      message: "Model archived successfully.",
      model,
    });
  } catch (error) {
    console.error("Archive model failed:", error);

    const message =
      error instanceof Error ? error.message : "Unable to archive model.";

    const status = message.toLowerCase().includes("not found")
      ? 404
      : message.toLowerCase().includes("cannot") ||
          message.toLowerCase().includes("already archived")
        ? 409
        : 500;

    res.status(status).json({
      success: false,
      message,
    });
  }
}

/**
 * Promote one ready model version to production.
 * Production status is independent from the latest-version pointer.
 */
export async function promoteOrganizationModelHandler(
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
    const model = await promoteModelVersionForOrganization(
      identity.organizationId,
      modelId,
    );

    res.status(200).json({
      success: true,
      message: "Model version promoted to production successfully.",
      model,
    });
  } catch (error) {
    console.error("Promote model version failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to promote model version.";

    const status = message.toLowerCase().includes("not found")
      ? 404
      : message.toLowerCase().includes("only ready") ||
          message.toLowerCase().includes("no saved artifact")
        ? 409
        : 500;

    res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function getOrganizationModelDetailsHandler(
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
    const model = await getModelDetailsForOrganization(
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

    res.status(200).json({
      success: true,
      model,
    });
  } catch (error) {
    console.error("Get model details failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve model details.",
    });
  }
}

export async function getOrganizationModelArtifactStatusHandler(
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

    if (model.status === "archived") {
      res.status(409).json({
        success: false,
        message:
          "Archived models cannot be checked through the active registry.",
      });
      return;
    }

    if (!model.artifact_key) {
      res.status(404).json({
        success: false,
        message: "Model artifact reference not found.",
      });
      return;
    }

    const artifactStatus = await getPythonModelArtifactStatus(
      model.artifact_key,
    );

    res.status(200).json({
      success: true,
      modelId: model.id,
      artifactStatus,
    });
  } catch (error) {
    console.error("Get model artifact status failed:", error);

    res.status(502).json({
      success: false,
      message: "Unable to retrieve Python model artifact status.",
    });
  }
}

// ---------------------------------------------
// Model Version History
// ---------------------------------------------

export async function listModelVersionsHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const identity = getIdentity(req, res);
  if (!identity) return;

  const modelId = req.params.modelId;

  if (!uuidSchema.safeParse(modelId).success) {
    res.status(400).json({
      success: false,
      message: "Invalid model ID.",
    });
    return;
  }

  try {
    const versions = await listModelVersionsForOrganization(
      identity.organizationId,
      modelId,
    );

    if (versions.length === 0) {
      res.status(404).json({
        success: false,
        message: "Model or model versions not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      modelId,
      versions,
      count: versions.length,
    });
  } catch (error) {
    console.error("List model versions failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve model versions.",
    });
  }
}

// ---------------------------------------------
// Latest Model Version
// ---------------------------------------------

export async function getLatestModelVersionHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const identity = getIdentity(req, res);
  if (!identity) return;

  const modelId = req.params.modelId;

  if (!uuidSchema.safeParse(modelId).success) {
    res.status(400).json({
      success: false,
      message: "Invalid model ID.",
    });
    return;
  }

  try {
    const model = await getLatestModelVersionForOrganization(
      identity.organizationId,
      modelId,
    );

    if (!model) {
      res.status(404).json({
        success: false,
        message: "Latest model version not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      model,
    });
  } catch (error) {
    console.error("Get latest model version failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve latest model version.",
    });
  }
}
