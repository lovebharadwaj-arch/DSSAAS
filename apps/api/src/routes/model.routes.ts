import { Router } from "express";
import {
  archiveOrganizationModelHandler,
  getLatestModelVersionHandler,
  getOrganizationModelArtifactStatusHandler,
  getOrganizationModelDetailsHandler,
  getOrganizationModelSchemaHandler,
  listModelVersionsHandler,
  listOrganizationJobsHandler,
  listOrganizationModelsHandler,
  predictOrganizationModelHandler,
  promoteOrganizationModelHandler,
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
router.post("/:modelId/promote", promoteOrganizationModelHandler);
router.delete("/:modelId", archiveOrganizationModelHandler);
router.get("/:modelId/details", getOrganizationModelDetailsHandler);
router.get(
  "/:modelId/artifacts/status",
  getOrganizationModelArtifactStatusHandler,
);
router.get("/:modelId/versions", listModelVersionsHandler);
router.get("/:modelId/latest", getLatestModelVersionHandler);

export default router;
