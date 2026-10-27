import { Router } from "express";

import {
  createOrUpdateDatasetProfile,
  fetchDatasetProfile,
  removeDatasetProfile,
} from "../controllers/datasetProfile.controller.ts";

import { authenticateToken } from "../middleware/auth.middleware.ts";
import { requireOrganizationMembership } from "../middleware/organization.middleware.ts";

const router = Router();

// Every dataset-profile endpoint requires a valid JWT.
router.use(authenticateToken);

// Every endpoint also checks organization membership.
router.use(requireOrganizationMembership);

router.post("/", createOrUpdateDatasetProfile);
router.get("/:datasetId", fetchDatasetProfile);
router.delete("/:datasetId", removeDatasetProfile);

export default router;
