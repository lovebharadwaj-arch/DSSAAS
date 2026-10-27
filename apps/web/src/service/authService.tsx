import { apiRequest } from "../lib/api";

interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  success?: boolean;
  message?: string;
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AuthApiResponse {
  success?: boolean;
  message?: string;
  data?: AuthResponse;
  accessToken?: string;
  user?: AuthResponse["user"];
}

function normalizeAuthResponse(response: AuthApiResponse): AuthResponse {
  const payload = response.data ?? response;

  if (!payload.accessToken) {
    throw new Error(response.message || "Authentication failed");
  }

  return payload as AuthResponse;
}

export function signupUser(data: SignupPayload) {
  return apiRequest<AuthApiResponse>("/auth/register", "", {
    method: "POST",
    body: JSON.stringify(data),
  }).then(normalizeAuthResponse);
}

export function loginUser(data: LoginPayload) {
  return apiRequest<AuthApiResponse>("/auth/login", "", {
    method: "POST",
    body: JSON.stringify(data),
  }).then(normalizeAuthResponse);
}
