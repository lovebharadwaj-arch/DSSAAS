import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";

import {
  addOrganizationMember,
  listOrganizationMembers,
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from "../services/organizationMember.service.ts";

const uuidSchema = z.string().uuid();

const addMemberSchema = z.object({
  email: z.string().trim().email().max(255),
  role: z.enum(["admin", "analyst", "viewer"]),
});

const updateRoleSchema = z.object({
  role: z.enum(["admin", "analyst", "viewer"]),
});

/**
 * Express route parameters can be string, string[], or undefined
 * depending on the installed Express type definitions.
 * Accept only a single string.
 */
function getParamString(
  value: string | string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function sendError(res: Response, error: unknown): void {
  const code = error instanceof Error ? error.message : "";

  const responses: Record<string, { status: number; message: string }> = {
    ORGANIZATION_PERMISSION_DENIED: {
      status: 403,
      message:
        "You do not have permission to manage or view this organization.",
    },
    INSUFFICIENT_ROLE_TO_ASSIGN: {
      status: 403,
      message: "Your role cannot assign the requested role.",
    },
    INSUFFICIENT_ROLE_TO_REMOVE: {
      status: 403,
      message: "Admins cannot remove other admins.",
    },
    USER_NOT_FOUND: {
      status: 404,
      message: "No registered user was found with that email.",
    },
    USER_ALREADY_MEMBER: {
      status: 409,
      message: "This user is already a member of the organization.",
    },
    MEMBER_NOT_FOUND: {
      status: 404,
      message: "Organization member not found.",
    },
    OWNER_ROLE_PROTECTED: {
      status: 409,
      message:
        "Owner membership is protected. Use an ownership-transfer workflow.",
    },
    CANNOT_REMOVE_SELF: {
      status: 400,
      message: "You cannot remove yourself through this endpoint.",
    },
  };

  const response = responses[code];

  if (response) {
    res.status(response.status).json({
      success: false,
      message: response.message,
    });
    return;
  }

  console.error("Organization membership error:", error);

  res.status(500).json({
    success: false,
    message: "An unexpected error occurred.",
  });
}

function getRequestIdentity(
  req: Request,
  res: Response,
): { actorId: string; organizationId: string } | null {
  const actorId = (req as AuthenticatedRequest).user?.id;
  const organizationId = getParamString(req.params.organizationId);

  if (!actorId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return null;
  }

  if (!organizationId || !uuidSchema.safeParse(organizationId).success) {
    res.status(400).json({
      success: false,
      message: "Invalid organization ID.",
    });
    return null;
  }

  return { actorId, organizationId };
}

export async function listMembersHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const identity = getRequestIdentity(req, res);

  if (!identity) return;

  try {
    const members = await listOrganizationMembers(
      identity.organizationId,
      identity.actorId,
    );

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function addMemberHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const identity = getRequestIdentity(req, res);

  if (!identity) return;

  const validation = addMemberSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid member data.",
      errors: validation.error.issues,
    });
    return;
  }

  try {
    await addOrganizationMember(
      identity.organizationId,
      identity.actorId,
      validation.data.email,
      validation.data.role,
    );

    res.status(201).json({
      success: true,
      message: "Organization member added successfully.",
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateMemberRoleHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const identity = getRequestIdentity(req, res);

  if (!identity) return;

  const targetUserId = getParamString(req.params.userId);

  if (!targetUserId || !uuidSchema.safeParse(targetUserId).success) {
    res.status(400).json({
      success: false,
      message: "Invalid user ID.",
    });
    return;
  }

  const validation = updateRoleSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid role.",
      errors: validation.error.issues,
    });
    return;
  }

  try {
    await updateOrganizationMemberRole(
      identity.organizationId,
      identity.actorId,
      targetUserId,
      validation.data.role,
    );

    res.status(200).json({
      success: true,
      message: "Member role updated successfully.",
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function removeMemberHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const identity = getRequestIdentity(req, res);

  if (!identity) return;

  const targetUserId = getParamString(req.params.userId);

  if (!targetUserId || !uuidSchema.safeParse(targetUserId).success) {
    res.status(400).json({
      success: false,
      message: "Invalid user ID.",
    });
    return;
  }

  try {
    await removeOrganizationMember(
      identity.organizationId,
      identity.actorId,
      targetUserId,
    );

    res.status(200).json({
      success: true,
      message: "Organization member removed successfully.",
    });
  } catch (error) {
    sendError(res, error);
  }
}
