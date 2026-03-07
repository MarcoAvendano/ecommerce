import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAdminUser } from "@/features/auth/admin-users.api";
import { adminUsersQueryKey } from "@/features/auth/admin-users.queries";

interface CreateAdminUserMutationOptions {
  onSuccess?: Parameters<typeof useMutation>[0] extends never
    ? never
    : (data: Awaited<ReturnType<typeof createAdminUser>>, variables: Parameters<typeof createAdminUser>[0]) => void;
}

export function useCreateAdminUserMutation(options?: CreateAdminUserMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
      options?.onSuccess?.(data, variables);
    },
  });
}