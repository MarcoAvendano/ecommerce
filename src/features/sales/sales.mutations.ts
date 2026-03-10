import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSalesOrder } from "@/features/sales/sales.api";
import { salesCreateContextQueryKey, salesQueryKey } from "@/features/sales/sales.queries";
import type { CreateSalesOrderInput } from "@/features/sales/schemas";

interface CreateSalesOrderMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof createSalesOrder>>, variables: CreateSalesOrderInput) => void;
}

export function useCreateSalesOrderMutation(options?: CreateSalesOrderMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSalesOrder,
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesCreateContextQueryKey }),
        queryClient.invalidateQueries({ queryKey: salesQueryKey }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}
