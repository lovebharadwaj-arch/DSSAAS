import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { pool } from "../config/postragesql.ts";
import type { AuthenticatedRequest } from "./auth.middleware.ts";

export async function requireOrganizationMembership(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authenticatedReq = req as AuthenticatedRequest;
  const userId = authenticatedReq.user?.id;

  // POST reads organizationId from the body.
  // GET and DELETE read it from the query string.
  const organizationId =
    req.params.organizationId ??
    req.body?.organizationId ??
    req.query.organizationId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (
    typeof organizationId !== "string" ||
    !z.string().uuid().safeParse(organizationId).success
  ) {
    res.status(400).json({
      success: false,
      message: "A valid organizationId is required",
    });
    return;
  }

  try {
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
        message: "You do not have access to this organization",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Organization authorization error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to verify organization access",
    });
  }
}
