import { pool } from "../config/postragesql.ts";

export async function listDatasets(
  organizationId: string,
  limit = 20,
  offset = 0,
) {
  const result = await pool.query(
    `SELECT
       id,
       organization_id,
       name,
       description,
       original_filename,
       file_size_bytes,
       status,
       created_at,
       updated_at
     FROM public.datasets
     WHERE organization_id = $1
       AND status <> 'deleted'
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [organizationId, limit, offset],
  );

  return result.rows;
}

export async function getDatasetById(
  organizationId: string,
  datasetId: string,
) {
  const result = await pool.query(
    `SELECT
       id,
       organization_id,
       name,
       description,
       original_filename,
       file_size_bytes,
       status,
       created_at,
       updated_at
     FROM public.datasets
     WHERE organization_id = $1
       AND id = $2
       AND status <> 'deleted'
     LIMIT 1`,
    [organizationId, datasetId],
  );

  return result.rows[0] ?? null;
}

export async function deleteDataset(
  organizationId: string,
  datasetId: string,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE public.datasets
     SET status = 'deleted',
         updated_at = NOW()
     WHERE organization_id = $1
       AND id = $2
       AND status <> 'deleted'
     RETURNING id`,
    [organizationId, datasetId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function getDatasetForTraining(
  organizationId: string,
  datasetId: string,
) {
  const result = await pool.query(
    `SELECT
       id,
       organization_id,
       name,
       original_filename,
       storage_key,
       status
     FROM public.datasets
     WHERE organization_id = $1
       AND id = $2
       AND status = 'ready'
     LIMIT 1`,
    [organizationId, datasetId],
  );

  return result.rows[0] ?? null;
}
