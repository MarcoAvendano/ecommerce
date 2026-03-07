import { useQuery } from "@tanstack/react-query";
import { listAdminUsers } from "@/features/auth/admin-users.api";

export const adminUsersQueryKey = ["admin-users"] as const;

export function useAdminUsersQuery() {
  return useQuery({
    queryKey: adminUsersQueryKey,
    queryFn: listAdminUsers,
  });
}