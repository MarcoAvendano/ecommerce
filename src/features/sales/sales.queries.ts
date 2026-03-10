import { useQuery } from "@tanstack/react-query";
import { getSalesCreateContext, listSalesOrders } from "@/features/sales/sales.api";

export const salesCreateContextQueryKey = ["sales", "create-context"] as const;
export const salesQueryKey = ["sales"] as const;

export function useSalesCreateContextQuery() {
  return useQuery({
    queryKey: salesCreateContextQueryKey,
    queryFn: getSalesCreateContext,
  });
}

export function useSalesQuery() {
  return useQuery({
    queryKey: salesQueryKey,
    queryFn: listSalesOrders
  })
}