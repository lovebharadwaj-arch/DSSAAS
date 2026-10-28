import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.ts";

import { connectMongoDB } from "./config/mongodb.ts";
import { connectDatabase } from "./config/postragesql.ts";
import {
  authenticateToken,
  type AuthenticatedRequest,
} from "./middleware/auth.middleware.ts";
import authRoutes from "./routes/auth.routes.ts";
import datasetProfileRoutes from "./routes/datasetProfile.routes.ts";

import csvCorrectorRoutes from "./routes/csvCorrector.routes.ts";
import datasetRoutes from "./routes/dataset.route.ts";
import datasetUploadRoutes from "./routes/datasetUpload.routes.ts";
import mlRoutes from "./routes/ML.routes.ts";
import organizationRoutes from "./routes/organization.route.ts";
import organizationMemberRoutes from "./routes/organizationMember.route.ts";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Analytics SaaS API is running",
    service: "api",
  });
});

// Dataset profile routes
app.use("/api/dataset-profiles", datasetProfileRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/organizations", organizationRoutes);

app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication successful",
    user: req.user,
  });
});
app.use("/api/organizations/:organizationId/members", organizationMemberRoutes);

// Start the server only after database connections succeed
async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await connectMongoDB();

    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start API:", error);
    process.exitCode = 1;
  }
}

void startServer();

app.use("/api/organizations/:organizationId/datasets", datasetUploadRoutes);
app.use("/api/organizations/:organizationId/datasets", datasetRoutes);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", csvCorrectorRoutes);

app.use("/api/models", mlRoutes);
