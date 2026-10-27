import { randomBytes } from "node:crypto";
import { pool } from "../config/postragesql.ts";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  role?: string;
}

export async function createOrganization(
  name: string,
  userId: string,
): Promise<Organization> {
  const client = await pool.connect();

  const baseSlug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "organization";

  // Add a suffix so organizations with similar names can coexist.
  const slug = `${baseSlug}-${randomBytes(3).toString("hex")}`;

  try {
    await client.query("BEGIN");

    const organizationResult = await client.query<Organization>(
      `INSERT INTO public.organizations (name, slug, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, slug, created_by, created_at, updated_at`,
      [name.trim(), slug, userId],
    );

    const organization = organizationResult.rows[0];

    await client.query(
      `INSERT INTO public.memberships (organization_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [organization.id, userId],
    );

    await client.query("COMMIT");

    return { ...organization, role: "owner" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserOrganizations(
  userId: string,
): Promise<Organization[]> {
  const result = await pool.query<Organization>(
    `SELECT
       o.id,
       o.name,
       o.slug,
       o.created_by,
       o.created_at,
       o.updated_at,
       m.role
     FROM public.organizations o
     INNER JOIN public.memberships m
       ON m.organization_id = o.id
     WHERE m.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId],
  );

  return result.rows;
}
