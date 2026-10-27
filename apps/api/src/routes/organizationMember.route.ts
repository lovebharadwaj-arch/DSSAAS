import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.ts";
import {
  addMemberHandler,
  listMembersHandler,
  removeMemberHandler,
  updateMemberRoleHandler,
} from "../controllers/organizationMember.controller.ts";

const router = Router({ mergeParams: true });

router.use(authenticateToken);

router.get("/", listMembersHandler);
router.post("/", addMemberHandler);
router.patch("/:userId/role", updateMemberRoleHandler);
router.delete("/:userId", removeMemberHandler);

export default router;
