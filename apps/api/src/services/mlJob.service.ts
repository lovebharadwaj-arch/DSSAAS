import fs from "node:fs/promises";
import path from "node:path";

import { pool } from "../config/postragesql.ts";

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

export async function ensureModelArtifactDirectory(): Promise<string> {
  const baseDir = path.resolve(process.cwd(), "uploads", "models");
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

export async function createTrainingJob(input: CreateTrainingJobInput) {
  const result = await pool.query(
    `INSERT INTO public.analysis_jobs (
       organization_id,
       dataset_id,
       created_by,
       job_type,
       status,
       parameters,
       started_at
     )
     VALUES ($1, $2, $3, 'model_training', 'queued', $4::jsonb, NOW())
     RETURNING *`,
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
    `UPDATE public.analysis_jobs
     SET status = $1,
         result_summary = COALESCE($2::jsonb, '{}'::jsonb),
         error_message = $3,
         started_at = COALESCE($4, started_at),
         finished_at = $5,
         updated_at = NOW()
     WHERE id = $6 AND organization_id = $7
     RETURNING *`,
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

export async function createModelRecord(input: ModelMetadataInput) {
  const result = await pool.query(
    `INSERT INTO public.models (
       organization_id,
       analysis_job_id,
       name,
       algorithm,
       task_type,
       status,
       artifact_key,
       metrics
     )
     VALUES ($1, $2, $3, $4, $5, 'ready', $6, $7::jsonb)
     RETURNING *`,
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

export async function listTrainingJobs(organizationId: string) {
  const result = await pool.query(
    `SELECT *
     FROM public.analysis_jobs
     WHERE organization_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [organizationId],
  );

  return result.rows;
}

export async function getTrainingJob(organizationId: string, jobId: string) {
  const result = await pool.query(
    `SELECT *
     FROM public.analysis_jobs
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, jobId],
  );

  return result.rows[0] ?? null;
}

export async function listModelsForOrganization(organizationId: string) {
  const result = await pool.query(
    `SELECT *
     FROM public.models
     WHERE organization_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [organizationId],
  );

  return result.rows;
}

export async function getModelForOrganization(
  organizationId: string,
  modelId: string,
) {
  const result = await pool.query(
    `SELECT *
     FROM public.models
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, modelId],
  );

  return result.rows[0] ?? null;
}

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
