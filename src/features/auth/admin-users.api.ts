import type { CreateInternalUserInput } from "@/features/auth/schemas";
import type {
  AdminUsersListResponse,
  CreateInternalUserResponse,
} from "@/features/auth/admin-users.types";

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Ocurrio un error inesperado.");
  }

  return payload as T;
}

export async function listAdminUsers(): Promise<AdminUsersListResponse> {
  const response = await fetch("/api/admin/users", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<AdminUsersListResponse>(response);
}

export async function createAdminUser(
  input: CreateInternalUserInput,
): Promise<CreateInternalUserResponse> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<CreateInternalUserResponse>(response);
}