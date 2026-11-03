import { Router } from "express";
import {
  getOrganizationModelSchemaHandler,
  listOrganizationJobsHandler,
  listOrganizationModelsHandler,
  predictOrganizationModelHandler,
} from "../controllers/modelManagement.controller.ts";
import { authenticateToken } from "../middleware/auth.middleware.ts";
import { requireOrganizationMembership } from "../middleware/organization.middleware.ts";

const router = Router({ mergeParams: true });

router.use(authenticateToken);
router.use(requireOrganizationMembership);

router.get("/jobs", listOrganizationJobsHandler);
router.get("/", listOrganizationModelsHandler);
router.post("/:modelId/predict", predictOrganizationModelHandler);
router.get("/:modelId/schema", getOrganizationModelSchemaHandler);

export default router;
