import "dotenv/config";
import mongoose from "mongoose";
import { connectMongoDB } from "./config/mongodb.ts";

async function testMongoDB(): Promise<void> {
  try {
    await connectMongoDB();

    const result = await mongoose.connection.db?.admin().ping();

    console.log("MongoDB ping result:", result);
    console.log("MongoDB connection test passed!");
  } catch (error) {
    console.error("MongoDB test failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

testMongoDB();
