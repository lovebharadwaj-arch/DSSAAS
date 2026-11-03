import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { pool } from "../config/postragesql.ts";
import type { AuthenticatedRequest } from "./auth.middleware.ts";

const organizationIdSchema = z.string().uuid();

export async function requireOrganizationMembership(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authenticatedReq = req as AuthenticatedRequest;

  // Get authenticated user ID
  const userId = authenticatedReq.user?.id;

  // Get organization ID from route parameters, body, or query
  const organizationId =
    req.params.organizationId ??
    req.body?.organizationId ??
    req.query.organizationId;

  // Temporary debugging
  console.log("ORGANIZATION MIDDLEWARE DEBUG:", {
    method: req.method,
    originalUrl: req.originalUrl,
    params: req.params,
    organizationId,
    userId,
  });

  // Verify authentication
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  // Validate organization ID
  if (
    typeof organizationId !== "string" ||
    !organizationIdSchema.safeParse(organizationId).success
  ) {
    res.status(400).json({
      success: false,
      message: "A valid organizationId is required.",
    });
    return;
  }

  try {
    // Verify user belongs to the requested organization
    const result = await pool.query(
      `SELECT 1
       FROM public.memberships
       WHERE user_id = $1
         AND organization_id = $2
       LIMIT 1`,
      [userId, organizationId],
    );

    if (result.rowCount === 0) {
      res.status(403).json({
        success: false,
        message: "You do not have access to this organization.",
      });
      return;
    }

    // Organization access verified
    next();
  } catch (error) {
    console.error("Organization authorization error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to verify organization access.",
    });
  }
}
