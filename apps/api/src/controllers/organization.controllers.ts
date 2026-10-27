import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import {
  createOrganization,
  getUserOrganizations,
} from "../services/organization.service.ts";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(150),
});

export async function createOrganizationHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const authenticatedReq = req as AuthenticatedRequest;
  const userId = authenticatedReq.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const validation = createOrganizationSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid organization data",
      errors: validation.error.issues,
    });
    return;
  }

  try {
    const organization = await createOrganization(validation.data.name, userId);

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: organization,
    });
  } catch (error) {
    console.error("Create organization failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create organization",
    });
  }
}

export async function listOrganizationsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const authenticatedReq = req as AuthenticatedRequest;
  const userId = authenticatedReq.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const organizations = await getUserOrganizations(userId);

    res.status(200).json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error("List organizations failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch organizations",
    });
  }
}
