
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

export async function connectDatabase(): Promise<void> {
  try {
    const result = await pool.query(
      "SELECT current_database(), version()"
    );

    console.log("PostgreSQL connected:", result.rows[0].current_database);
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    throw error;
  }
}