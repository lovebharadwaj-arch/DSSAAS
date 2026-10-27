import { apiRequest } from "./api";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role?: "owner" | "admin" | "analyst" | "viewer";
  created_by?: string;
}

interface OrganizationsResponse {
  success: boolean;
  data: Organization[];
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
