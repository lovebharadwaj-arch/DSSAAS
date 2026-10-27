import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/postragesql.ts";

async function runMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    // The initial migration creates this table, but the runner
    // also needs it to exist before checking migration status.
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDirectory = path.resolve(process.cwd(), "migrations");

    const files = (await fs.readdir(migrationsDirectory))
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort();

    for (const file of files) {
      const version = file.replace(/\.sql$/, "");

      const existing = await client.query(
        `SELECT version
         FROM public.schema_migrations
         WHERE version = $1`,
        [version],
      );

      if (existing.rowCount && existing.rowCount > 0) {
        console.log(`Skipping already applied migration: ${version}`);
        continue;
      }

      const sql = await fs.readFile(
        path.join(migrationsDirectory, file),
        "utf8",
      );

      console.log(`Running migration: ${version}`);

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          `INSERT INTO public.schema_migrations (version)
           VALUES ($1)`,
          [version],
        );
        await client.query("COMMIT");

        console.log(`Migration completed: ${version}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("All database migrations are up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
