import { Router } from "express";

import { authenticateToken } from "../middleware/auth.middleware.ts";
import { requireOrganizationMembership } from "../middleware/organization.middleware.ts";
import { uploadCsv } from "../middleware/upload.middleware.ts";

import {
  deleteDatasetHandler,
  getDatasetHandler,
  listDatasetsHandler,
} from "../controllers/dataset.controller.ts";
import { uploadDatasetHandler } from "../controllers/datasetUpload.controller.ts";

import { profileDatasetHandler } from "../controllers/csvProfilling.controller.ts";

import { saveCleanedDatasetVersionHandler } from "../controllers/cleanedDatasetVersion.controller.ts";
import { columnDistributionHandler } from "../controllers/columnDistribution.controller.ts";
import { previewDataCleaningHandler } from "../controllers/dataCleaning.controller.ts";
import { previewDatasetHandler } from "../controllers/dataSetPreview.controller.ts";

import { trainDatasetModelHandler } from "../controllers/mlTraining.controller.ts";

const router = Router({ mergeParams: true });

router.use(authenticateToken);
router.use(requireOrganizationMembership);

router.post("/:datasetId/profile", profileDatasetHandler);
// Authentication and organization access for every dataset endpoint
router.use(authenticateToken);
router.use(requireOrganizationMembership);

// Upload a CSV dataset
router.post("/", uploadCsv, uploadDatasetHandler);

// List datasets
router.get("/", listDatasetsHandler);

// Get one dataset
router.get("/:datasetId", getDatasetHandler);

// Soft-delete a dataset
router.delete("/:datasetId", deleteDatasetHandler);

router.get("/:datasetId/preview", previewDatasetHandler);

router.post("/:datasetId/distribution", columnDistributionHandler);

router.post("/:datasetId/clean/preview", previewDataCleaningHandler);

router.post("/:datasetId/clean/save", saveCleanedDatasetVersionHandler);

router.post("/:datasetId/train", trainDatasetModelHandler);

export default router;
