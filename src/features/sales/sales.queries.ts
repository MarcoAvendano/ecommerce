import { useQuery } from "@tanstack/react-query";
import {
  getCustomerAddresses,
  getSalesCreateContext,
  getSalesOrderDetail,
  listSalesOrders,
} from "@/features/sales/sales.api";

export const salesCreateContextQueryKey = ["sales", "create-context"] as const;
export const salesQueryKey = ["sales"] as const;
export const salesOrderDetailQueryKey = (orderId: string) => ["sales", "order", orderId] as const;
export const customerAddressesQueryKey = (customerId: string) =>
  ["customers", customerId, "addresses"] as const;

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

export function useSalesOrderDetailQuery(orderId: string, enabled = true) {
  return useQuery({
    queryKey: salesOrderDetailQueryKey(orderId),
    queryFn: () => getSalesOrderDetail(orderId),
    enabled: enabled && Boolean(orderId),
  });
}

export function useCustomerAddressesQuery(customerId: string | null) {
  return useQuery({
    queryKey: customerAddressesQueryKey(customerId ?? ""),
    queryFn: () => getCustomerAddresses(customerId!),
    enabled: !!customerId,
  });
}