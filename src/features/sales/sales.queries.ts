import { useQuery } from "@tanstack/react-query";
import { getSalesCreateContext } from "@/features/sales/sales.api";

export const salesCreateContextQueryKey = ["sales", "create-context"] as const;

export function useSalesCreateContextQuery() {
  return useQuery({
    queryKey: salesCreateContextQueryKey,
    queryFn: getSalesCreateContext,
  });
}
