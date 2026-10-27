import { pool } from "../config/postragesql.ts";

export type MemberRole = "owner" | "admin" | "analyst" | "viewer";

interface OrganizationMember {
  user_id: string;
  name: string;
  email: string;
  role: MemberRole;
  joined_at: Date;
}

const editableRoles = ["admin", "analyst", "viewer"] as const;
type EditableRole = (typeof editableRoles)[number];

async function getActorRole(
  organizationId: string,
  actorId: string,
): Promise<MemberRole | null> {
  const result = await pool.query<{ role: MemberRole }>(
    `SELECT role
     FROM public.memberships
     WHERE organization_id = $1 AND user_id = $2`,
    [organizationId, actorId],
  );

  return result.rows[0]?.role ?? null;
}

async function requireManager(
  organizationId: string,
  actorId: string,
): Promise<MemberRole> {
  const role = await getActorRole(organizationId, actorId);

  if (role !== "owner" && role !== "admin") {
    throw new Error("ORGANIZATION_PERMISSION_DENIED");
  }

  return role;
}

export async function listOrganizationMembers(
  organizationId: string,
  actorId: string,
): Promise<OrganizationMember[]> {
  const role = await getActorRole(organizationId, actorId);

  if (!role) {
    throw new Error("ORGANIZATION_PERMISSION_DENIED");
  }

  const result = await pool.query<OrganizationMember>(
    `SELECT
       u.id AS user_id,
       u.name,
       u.email,
       m.role,
       m.joined_at
     FROM public.memberships m
     INNER JOIN public.users u ON u.id = m.user_id
     WHERE m.organization_id = $1
     ORDER BY
       CASE m.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'analyst' THEN 3
         ELSE 4
       END,
       u.name ASC`,
    [organizationId],
  );

  return result.rows;
}

export async function addOrganizationMember(
  organizationId: string,
  actorId: string,
  email: string,
  requestedRole: EditableRole,
): Promise<void> {
  const actorRole = await requireManager(organizationId, actorId);

  // Admins can add analysts and viewers, but not other admins.
  if (actorRole === "admin" && requestedRole === "admin") {
    throw new Error("INSUFFICIENT_ROLE_TO_ASSIGN");
  }

  const userResult = await pool.query<{ id: string }>(
    `SELECT id
     FROM public.users
     WHERE email = $1`,
    [email.trim().toLowerCase()],
  );

  const targetUser = userResult.rows[0];

  if (!targetUser) {
    throw new Error("USER_NOT_FOUND");
  }

  try {
    await pool.query(
      `INSERT INTO public.memberships (organization_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [organizationId, targetUser.id, requestedRole],
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new Error("USER_ALREADY_MEMBER");
    }

    throw error;
  }
}

export async function updateOrganizationMemberRole(
  organizationId: string,
  actorId: string,
  targetUserId: string,
  newRole: EditableRole,
): Promise<void> {
  const actorRole = await requireManager(organizationId, actorId);

  if (actorRole === "admin" && newRole === "admin") {
    throw new Error("INSUFFICIENT_ROLE_TO_ASSIGN");
  }

  const targetRole = await getActorRole(organizationId, targetUserId);

  if (!targetRole) {
    throw new Error("MEMBER_NOT_FOUND");
  }

  // Owner changes must use a dedicated ownership-transfer workflow.
  if (targetRole === "owner") {
    throw new Error("OWNER_ROLE_PROTECTED");
  }

  const result = await pool.query(
    `UPDATE public.memberships
     SET role = $1
     WHERE organization_id = $2 AND user_id = $3`,
    [newRole, organizationId, targetUserId],
  );

  if (result.rowCount === 0) {
    throw new Error("MEMBER_NOT_FOUND");
  }
}

export async function removeOrganizationMember(
  organizationId: string,
  actorId: string,
  targetUserId: string,
): Promise<void> {
  const actorRole = await requireManager(organizationId, actorId);

  if (actorId === targetUserId) {
    throw new Error("CANNOT_REMOVE_SELF");
  }

  const targetRole = await getActorRole(organizationId, targetUserId);

  if (!targetRole) {
    throw new Error("MEMBER_NOT_FOUND");
  }

  if (targetRole === "owner") {
    throw new Error("OWNER_ROLE_PROTECTED");
  }

  // Admins cannot remove other admins.
  if (actorRole === "admin" && targetRole === "admin") {
    throw new Error("INSUFFICIENT_ROLE_TO_REMOVE");
  }

  await pool.query(
    `DELETE FROM public.memberships
     WHERE organization_id = $1 AND user_id = $2`,
    [organizationId, targetUserId],
  );
}
