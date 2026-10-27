import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.ts";
import {
  createOrganizationHandler,
  listOrganizationsHandler,
} from "../controllers/organization.controllers.ts";

const router = Router();

// Every organization endpoint requires a valid JWT.
router.use(authenticateToken);

router.post("/", createOrganizationHandler);
router.get("/", listOrganizationsHandler);

export default router;
