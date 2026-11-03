import { apiRequest } from "./api";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role?: "owner" | "admin" | "analyst" | "viewer";
  created_by?: string;
}

export interface OrganizationMember {
  user_id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "analyst" | "viewer";
  joined_at: string;
}

interface OrganizationsResponse {
  success: boolean;
  data: Organization[];
}

interface MembersResponse {
  success: boolean;
  data: OrganizationMember[];
}

interface CreateOrganizationResponse {
  success: boolean;
  message: string;
  data: Organization;
}

export async function getMyOrganizations(token: string) {
  const result = await apiRequest<OrganizationsResponse>(
    "/organizations",
    token,
  );

  return result.data;
}

export async function createOrganization(token: string, name: string) {
  const result = await apiRequest<CreateOrganizationResponse>(
    "/organizations",
    token,
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
  );

  return result.data;
}

export async function getOrganizationMembers(
  token: string,
  organizationId: string,
) {
  const result = await apiRequest<MembersResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/members`,
    token,
  );

  return result.data;
}

export async function addOrganizationMember(
  token: string,
  organizationId: string,
  email: string,
  role: "admin" | "analyst" | "viewer",
) {
  const result = await apiRequest<{ success: boolean; message: string }>(
    `/organizations/${encodeURIComponent(organizationId)}/members`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ email, role }),
    },
  );

  return result;
}

export async function updateOrganizationMemberRole(
  token: string,
  organizationId: string,
  userId: string,
  role: "admin" | "analyst" | "viewer",
) {
  const result = await apiRequest<{ success: boolean; message: string }>(
    `/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}/role`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );

  return result;
}
