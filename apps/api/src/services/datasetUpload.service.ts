import path from "node:path";
import { pool } from "../config/postragesql.ts";

interface CreateDatasetInput {
  organizationId: string;
  userId: string;
  name: string;
  description?: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  filePath: string;
  schemaSnapshot: {
    columns: string[];
    rowCount: number;
  };
}

export async function createDataset(input: CreateDatasetInput) {
  const client = await pool.connect();

  const storageKey = `local/datasets/${path.basename(input.filePath)}`;

  try {
    await client.query("BEGIN");

    const datasetResult = await client.query(
      `INSERT INTO public.datasets (
         organization_id,
         created_by,
         name,
         description,
         original_filename,
         mime_type,
         file_size_bytes,
         storage_key,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ready')
       RETURNING
         id,
         organization_id,
         name,
         description,
         original_filename,
         file_size_bytes,
         status,
         created_at`,
      [
        input.organizationId,
        input.userId,
        input.name,
        input.description ?? null,
        input.originalFilename,
        input.mimeType,
        input.fileSizeBytes,
        storageKey,
      ],
    );

    const dataset = datasetResult.rows[0];

    await client.query(
      `INSERT INTO public.dataset_versions (
         organization_id,
         dataset_id,
         version_number,
         storage_key,
         file_size_bytes,
         schema_snapshot,
         created_by
       )
       VALUES ($1, $2, 1, $3, $4, $5::jsonb, $6)`,
      [
        input.organizationId,
        dataset.id,
        storageKey,
        input.fileSizeBytes,
        JSON.stringify(input.schemaSnapshot),
        input.userId,
      ],
    );

    await client.query("COMMIT");

    return dataset;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
