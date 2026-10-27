import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.ts";
import { requireOrganizationMembership } from "../middleware/organization.middleware.ts";
import { uploadCsv } from "../middleware/upload.middleware.ts";
import { uploadDatasetHandler } from "../controllers/datasetUpload.controller.ts";

const router = Router({ mergeParams: true });

router.post(
  "/",
  authenticateToken,
  requireOrganizationMembership,
  uploadCsv,
  uploadDatasetHandler,
);

export default router;
