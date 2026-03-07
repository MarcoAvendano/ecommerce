import type { CreateInternalUserInput } from "@/features/auth/schemas";

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string | null;
  status: "active" | "inactive" | "invited" | string;
  createdAt: string;
  lastSignInAt: string | null;
  roleCodes: string[];
  roleNames: string[];
}

export interface AdminUsersListResponse {
  users: AdminUserListItem[];
}

export interface CreateInternalUserResponse {
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    roleCode: CreateInternalUserInput["roleCode"];
  };
}