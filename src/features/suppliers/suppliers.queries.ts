import { useQuery } from "@tanstack/react-query";
import {
  getPurchaseCreateContext,
  getPurchaseOrderById,
  getSupplierById,
  listPurchaseOrders,
  listSuppliers,
} from "@/features/suppliers/suppliers.api";

export const suppliersQueryKey = ["suppliers"] as const;
export const supplierDetailQueryKey = (supplierId: string) => [...suppliersQueryKey, "detail", supplierId] as const;
export const purchaseOrdersQueryKey = (supplierId?: string) => [...suppliersQueryKey, "purchase-orders", supplierId ?? "all"] as const;
export const purchaseCreateContextQueryKey = (mode: "create" | "receipt" = "create") => [...suppliersQueryKey, "purchase-create-context", mode] as const;
export const purchaseOrderDetailQueryKey = (orderId: string, includeMovements = true) => [...suppliersQueryKey, "purchase-order", orderId, includeMovements ? "with-movements" : "without-movements"] as const;

export function useSuppliersQuery() {
  return useQuery({
    queryKey: suppliersQueryKey,
    queryFn: listSuppliers,
  });
}

export function useSupplierDetailQuery(supplierId: string, enabled = true) {
  return useQuery({
    queryKey: supplierDetailQueryKey(supplierId),
    queryFn: () => getSupplierById(supplierId),
    enabled,
  });
}

export function usePurchaseOrdersQuery(supplierId?: string, enabled = true) {
  return useQuery({
    queryKey: purchaseOrdersQueryKey(supplierId),
    queryFn: () => listPurchaseOrders(supplierId),
    enabled,
  });
}

export function usePurchaseCreateContextQuery(options?: { enabled?: boolean; mode?: "create" | "receipt" }) {
  const enabled = options?.enabled ?? true;
  const mode = options?.mode ?? "create";

  return useQuery({
    queryKey: purchaseCreateContextQueryKey(mode),
    queryFn: () => getPurchaseCreateContext(mode),
    enabled,
  });
}

export function usePurchaseOrderDetailQuery(orderId: string, options?: { enabled?: boolean; includeMovements?: boolean }) {
  const enabled = options?.enabled ?? true;
  const includeMovements = options?.includeMovements ?? true;

  return useQuery({
    queryKey: purchaseOrderDetailQueryKey(orderId, includeMovements),
    queryFn: () => getPurchaseOrderById(orderId, { includeMovements }),
    enabled,
  });
}
