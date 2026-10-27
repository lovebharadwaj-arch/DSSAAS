import { Router } from "express";
import { requireOrganizationMembership } from "../middleware/organization.middleware.ts";
import { csvUpload } from "../middleware/csvUpload.middleware.ts";
import { correctCsvUpload } from "../controllers/csvCorrector.controller.ts";

const router = Router();

router.post(
  "/organizations/:organizationId/csv/correct",
  requireOrganizationMembership,
  csvUpload.single("file"),
  correctCsvUpload,
);

export default router;
