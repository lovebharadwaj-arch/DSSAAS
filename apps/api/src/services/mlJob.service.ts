import fs from "node:fs/promises";
import path from "node:path";

import { pool } from "../config/postragesql.ts";

// =====================================================
// Types
// =====================================================

export type TrainingJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface CreateTrainingJobInput {
  organizationId: string;
  datasetId: string;
  userId: string;
  task: "classification" | "regression";
  targetColumn: string;
  testSize: number;
  algorithm?: string;
}

export interface ModelMetadataInput {
  organizationId: string;
  analysisJobId: string;
  name: string;
  algorithm: string;
  taskType: "classification" | "regression";
  metrics: Record<string, number>;
  artifactKey?: string | null;
}

export interface CreateModelVersionInput extends ModelMetadataInput {
  sourceModelId: string;
}

// =====================================================
// Artifact Directory
// =====================================================

export async function ensureModelArtifactDirectory(): Promise<string> {
  const baseDir = path.resolve(process.cwd(), "uploads", "models");

  await fs.mkdir(baseDir, { recursive: true });

  return baseDir;
}

// =====================================================
// Training Job Creation
// =====================================================

export async function createTrainingJob(input: CreateTrainingJobInput) {
  const result = await pool.query(
    `
    INSERT INTO public.analysis_jobs (
      organization_id,
      dataset_id,
      created_by,
      job_type,
      status,
      parameters,
      started_at
    )
    VALUES ($1, $2, $3, 'model_training', 'queued', $4::jsonb, NOW())
    RETURNING *
    `,
    [
      input.organizationId,
      input.datasetId,
      input.userId,
      JSON.stringify({
        task: input.task,
        target_column: input.targetColumn,
        test_size: input.testSize,
        algorithm: input.algorithm ?? "random_forest",
      }),
    ],
  );

  return result.rows[0];
}

// =====================================================
// Training Job Status
// =====================================================

export async function updateTrainingJobStatus(
  organizationId: string,
  jobId: string,
  status: TrainingJobStatus,
  options: {
    resultSummary?: Record<string, unknown>;
    errorMessage?: string | null;
    startedAt?: Date | null;
    finishedAt?: Date | null;
  } = {},
) {
  const result = await pool.query(
    `
    UPDATE public.analysis_jobs
    SET status = $1,
        result_summary = COALESCE($2::jsonb, '{}'::jsonb),
        error_message = $3,
        started_at = COALESCE($4, started_at),
        finished_at = $5,
        updated_at = NOW()
    WHERE id = $6
      AND organization_id = $7
      AND job_type = 'model_training'
    RETURNING *
    `,
    [
      status,
      options.resultSummary ? JSON.stringify(options.resultSummary) : null,
      options.errorMessage ?? null,
      options.startedAt ? options.startedAt.toISOString() : null,
      options.finishedAt ? options.finishedAt.toISOString() : null,
      jobId,
      organizationId,
    ],
  );

  return result.rows[0] ?? null;
}

// =====================================================
// Initial Model Registration - Version 1
// =====================================================

export async function createModelRecord(input: ModelMetadataInput) {
  const result = await pool.query(
    `
    WITH new_model AS (
      SELECT gen_random_uuid() AS id
    )
    INSERT INTO public.models (
      id,
      organization_id,
      analysis_job_id,
      name,
      algorithm,
      task_type,
      status,
      artifact_key,
      metrics,
      model_family_id,
      version,
      parent_model_id,
      is_latest
    )
    SELECT
      new_model.id,
      $1,
      $2,
      $3,
      $4,
      $5,
      'ready',
      $6,
      $7::jsonb,
      new_model.id,
      1,
      NULL,
      TRUE
    FROM new_model
    RETURNING *
    `,
    [
      input.organizationId,
      input.analysisJobId,
      input.name,
      input.algorithm,
      input.taskType,
      input.artifactKey ?? null,
      JSON.stringify(input.metrics),
    ],
  );

  return result.rows[0];
}

// =====================================================
// Create New Model Version
// =====================================================

export async function createModelVersionRecord(input: CreateModelVersionInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Find the source model within the organization.
    const sourceResult = await client.query(
      `
      SELECT
        id,
        organization_id,
        model_family_id,
        version,
        status
      FROM public.models
      WHERE id = $1
        AND organization_id = $2
      LIMIT 1
      `,
      [input.sourceModelId, input.organizationId],
    );

    const sourceModel = sourceResult.rows[0];

    if (!sourceModel) {
      throw new Error("Source model not found.");
    }

    if (sourceModel.status !== "ready") {
      throw new Error(
        "Source model must be ready before creating a new version.",
      );
    }

    const familyId = sourceModel.model_family_id;

    // 2. Lock the family root to serialize version creation.
    const familyLock = await client.query(
      `
      SELECT id
      FROM public.models
      WHERE id = $1
        AND organization_id = $2
      FOR UPDATE
      `,
      [familyId, input.organizationId],
    );

    if (familyLock.rowCount === 0) {
      throw new Error("Model family not found.");
    }

    // 3. Find the latest version.
    const latestResult = await client.query(
      `
      SELECT *
      FROM public.models
      WHERE organization_id = $1
        AND model_family_id = $2
        AND is_latest = TRUE
      LIMIT 1
      `,
      [input.organizationId, familyId],
    );

    const latestModel = latestResult.rows[0];

    if (!latestModel) {
      throw new Error("Latest model version not found.");
    }

    if (latestModel.status !== "ready") {
      throw new Error("Latest model version is not ready.");
    }

    const nextVersion = Number(latestModel.version) + 1;

    // 4. Mark the previous version as not latest.
    await client.query(
      `
      UPDATE public.models
      SET is_latest = FALSE,
          updated_at = NOW()
      WHERE organization_id = $1
        AND model_family_id = $2
        AND is_latest = TRUE
      `,
      [input.organizationId, familyId],
    );

    // 5. Register the new version.
    const result = await client.query(
      `
      INSERT INTO public.models (
        organization_id,
        analysis_job_id,
        name,
        algorithm,
        task_type,
        status,
        artifact_key,
        metrics,
        model_family_id,
        version,
        parent_model_id,
        is_latest
      )
      VALUES (
        $1, $2, $3, $4, $5, 'ready', $6, $7::jsonb,
        $8, $9, $10, TRUE
      )
      RETURNING *
      `,
      [
        input.organizationId,
        input.analysisJobId,
        input.name,
        input.algorithm,
        input.taskType,
        input.artifactKey ?? null,
        JSON.stringify(input.metrics),
        familyId,
        nextVersion,
        latestModel.id,
      ],
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// =====================================================
// Training Job Listing
// =====================================================

export async function listTrainingJobs(
  organizationId: string,
  options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {},
) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 10));
  const offset = (page - 1) * limit;

  const values: unknown[] = [organizationId];

  let statusFilter = "";

  if (options.status) {
    values.push(options.status);
    statusFilter = `AND status = $${values.length}`;
  }

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM public.analysis_jobs
    WHERE organization_id = $1
      AND job_type = 'model_training'
      ${statusFilter}
    `,
    values.slice(0, options.status ? 2 : 1),
  );

  const total = Number(countResult.rows[0]?.total ?? 0);

  const queryValues = [...values, limit, offset];

  const result = await pool.query(
    `
    SELECT *
    FROM public.analysis_jobs
    WHERE organization_id = $1
      AND job_type = 'model_training'
      ${statusFilter}
    ORDER BY created_at DESC
    LIMIT $${queryValues.length - 1}
    OFFSET $${queryValues.length}
    `,
    queryValues,
  );

  return {
    jobs: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// =====================================================
// Get Individual Training Job
// =====================================================

export async function getTrainingJob(organizationId: string, jobId: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM public.analysis_jobs
    WHERE organization_id = $1
      AND id = $2
      AND job_type = 'model_training'
    LIMIT 1
    `,
    [organizationId, jobId],
  );

  return result.rows[0] ?? null;
}

// =====================================================
// List Organization Models
// =====================================================

export async function listModelsForOrganization(organizationId: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM public.models
    WHERE organization_id = $1
      AND status <> 'archived'
    ORDER BY created_at DESC
    LIMIT 50
    `,
    [organizationId],
  );

  return result.rows;
}

// =====================================================
// Get Individual Model
// =====================================================

export async function getModelForOrganization(
  organizationId: string,
  modelId: string,
) {
  const result = await pool.query(
    `
    SELECT *
    FROM public.models
    WHERE organization_id = $1
      AND id = $2
    LIMIT 1
    `,
    [organizationId, modelId],
  );

  return result.rows[0] ?? null;
}

// =====================================================
// Model Version History
// =====================================================

export async function listModelVersionsForOrganization(
  organizationId: string,
  modelId: string,
) {
  const result = await pool.query(
    `
    SELECT versions.*
    FROM public.models AS selected
    INNER JOIN public.models AS versions
      ON versions.organization_id = selected.organization_id
     AND versions.model_family_id = selected.model_family_id
    WHERE selected.organization_id = $1
      AND selected.id = $2
    ORDER BY versions.version DESC
    `,
    [organizationId, modelId],
  );

  return result.rows;
}

// =====================================================
// Get Latest Model Version
// =====================================================

export async function getLatestModelVersionForOrganization(
  organizationId: string,
  modelId: string,
) {
  const result = await pool.query(
    `
    SELECT versions.*
    FROM public.models AS selected
    INNER JOIN public.models AS versions
      ON versions.organization_id = selected.organization_id
     AND versions.model_family_id = selected.model_family_id
    WHERE selected.organization_id = $1
      AND selected.id = $2
      AND versions.is_latest = TRUE
    LIMIT 1
    `,
    [organizationId, modelId],
  );

  return result.rows[0] ?? null;
}

// =====================================================
// Resolve Model Artifact Path
// =====================================================

export function resolveModelArtifactPath(
  artifactKey?: string | null,
): string | null {
  if (!artifactKey) {
    return null;
  }

  const cleaned = artifactKey.replace(/^\/+/, "");
  const modelFile = cleaned.replace(/^models\//, "");

  return path.resolve(process.cwd(), "uploads", "models", modelFile);
}

// =====================================================
// Archive Model - Soft Delete
// =====================================================

export async function archiveModelForOrganization(
  organizationId: string,
  modelId: string,
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const targetResult = await client.query(
      `
      SELECT id, model_family_id
      FROM public.models
      WHERE organization_id = $1
        AND id = $2
      FOR UPDATE
      `,
      [organizationId, modelId],
    );

    if (targetResult.rowCount === 0) {
      throw new Error("Model version not found.");
    }

    const target = targetResult.rows[0];

    // Lock the family root so version operations are serialized.
    await client.query(
      `
      SELECT id
      FROM public.models
      WHERE organization_id = $1
        AND model_family_id = $2
        AND parent_model_id IS NULL
      FOR UPDATE
      `,
      [organizationId, target.model_family_id],
    );

    const modelResult = await client.query(
      `
      SELECT *
      FROM public.models
      WHERE organization_id = $1
        AND id = $2
      FOR UPDATE
      `,
      [organizationId, modelId],
    );

    const model = modelResult.rows[0];

    if (!model) {
      throw new Error("Model version not found.");
    }

    if (model.status === "archived") {
      throw new Error("This model version is already archived.");
    }

    if (model.is_production) {
      throw new Error(
        "Cannot archive the production version. Promote another version first.",
      );
    }

    // If this is the latest version, find a replacement.
    if (model.is_latest) {
      const replacementResult = await client.query(
        `
        SELECT id
        FROM public.models
        WHERE organization_id = $1
          AND model_family_id = $2
          AND id <> $3
          AND status = 'ready'
          AND status <> 'archived'
        ORDER BY version DESC
        LIMIT 1
        FOR UPDATE
        `,
        [organizationId, target.model_family_id, modelId],
      );

      if (replacementResult.rowCount === 0) {
        throw new Error(
          "Cannot archive the latest version because this family has no other ready version.",
        );
      }

      const replacementId = replacementResult.rows[0].id;

      await client.query(
        `
        UPDATE public.models
        SET is_latest = FALSE,
            updated_at = NOW()
        WHERE organization_id = $1
          AND model_family_id = $2
          AND is_latest = TRUE
        `,
        [organizationId, target.model_family_id],
      );

      await client.query(
        `
        UPDATE public.models
        SET is_latest = TRUE,
            updated_at = NOW()
        WHERE organization_id = $1
          AND id = $2
        `,
        [organizationId, replacementId],
      );
    }

    // Soft archive only. Do not delete the model record or artifact.
    const archivedResult = await client.query(
      `
      UPDATE public.models
      SET status = 'archived',
          is_latest = FALSE,
          updated_at = NOW()
      WHERE organization_id = $1
        AND id = $2
      RETURNING *
      `,
      [organizationId, modelId],
    );

    await client.query("COMMIT");

    return archivedResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// =====================================================
// Model Details + Training Job Details
// =====================================================

export async function getModelDetailsForOrganization(
  organizationId: string,
  modelId: string,
) {
  const result = await pool.query(
    `
    SELECT
      m.id,
      m.organization_id,
      m.analysis_job_id,
      m.name,
      m.algorithm,
      m.task_type,
      m.status,
      m.artifact_key,
      m.metrics,
      m.model_family_id,
      m.version,
      m.parent_model_id,
      m.is_latest,
      m.created_at,
      m.updated_at,
      j.status AS training_status,
      j.parameters AS training_parameters,
      j.result_summary AS training_result,
      j.error_message AS training_error,
      j.started_at AS training_started_at,
      j.finished_at AS training_finished_at
    FROM public.models m
    LEFT JOIN public.analysis_jobs j
      ON j.id = m.analysis_job_id
     AND j.organization_id = m.organization_id
    WHERE m.organization_id = $1
      AND m.id = $2
    LIMIT 1
    `,
    [organizationId, modelId],
  );

  return result.rows[0] ?? null;
}

export async function promoteModelVersionForOrganization(
  organizationId: string,
  modelId: string,
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Find and lock the family root to prevent concurrent promotions.
    const targetResult = await client.query(
      `
      SELECT id, model_family_id
      FROM public.models
      WHERE organization_id = $1
        AND id = $2
      `,
      [organizationId, modelId],
    );

    if (targetResult.rowCount === 0) {
      throw new Error("Model version not found.");
    }

    const target = targetResult.rows[0];

    await client.query(
      `
      SELECT id
      FROM public.models
      WHERE organization_id = $1
        AND model_family_id = $2
        AND parent_model_id IS NULL
      FOR UPDATE
      `,
      [organizationId, target.model_family_id],
    );

    // Re-read the target after acquiring the family lock.
    const lockedTargetResult = await client.query(
      `
      SELECT id, status, artifact_key
      FROM public.models
      WHERE organization_id = $1
        AND id = $2
      FOR UPDATE
      `,
      [organizationId, modelId],
    );

    const model = lockedTargetResult.rows[0];

    if (!model) {
      throw new Error("Model version not found.");
    }

    if (model.status !== "ready") {
      throw new Error("Only ready model versions can be promoted.");
    }

    if (!model.artifact_key) {
      throw new Error("This model version has no saved artifact.");
    }

    // Clear the current production version in this family.
    await client.query(
      `
      UPDATE public.models
      SET is_production = FALSE,
          updated_at = NOW()
      WHERE organization_id = $1
        AND model_family_id = $2
        AND is_production = TRUE
      `,
      [organizationId, target.model_family_id],
    );

    // Promote the selected version.
    const promotedResult = await client.query(
      `
      UPDATE public.models
      SET is_production = TRUE,
          updated_at = NOW()
      WHERE organization_id = $1
        AND id = $2
      RETURNING *
      `,
      [organizationId, modelId],
    );

    await client.query("COMMIT");

    return promotedResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
