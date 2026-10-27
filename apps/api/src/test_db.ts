import dotenv from "dotenv";
import "dotenv/config";
import { pool } from "./config/postragesql.ts";

dotenv.config();

async function testDatabase() {
  try {
    const result = await pool.query(
      "SELECT current_database(), NOW() AS server_time",
    );

    console.log("Database connection successful!");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testDatabase();
