import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPurchaseOrder,
  createSupplier,
  createSupplierContact,
  deleteSupplier,
  deleteSupplierContact,
  receivePurchaseOrder,
  updatePurchaseOrder,
  updateSupplier,
  updateSupplierContact,
} from "@/features/suppliers/suppliers.api";
import {
  purchaseCreateContextQueryKey,
  purchaseOrderDetailQueryKey,
  purchaseOrdersQueryKey,
  supplierDetailQueryKey,
  suppliersQueryKey,
} from "@/features/suppliers/suppliers.queries";
import type {
  CreatePurchaseOrderInput,
  CreateSupplierContactInput,
  CreateSupplierInput,
  ReceivePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  UpdateSupplierContactInput,
  UpdateSupplierInput,
} from "@/features/suppliers/schemas";

interface CreateSupplierMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof createSupplier>>, variables: CreateSupplierInput) => void;
}

interface UpdateSupplierMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof updateSupplier>>, variables: UpdateSupplierInput) => void;
}

interface DeleteSupplierMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof deleteSupplier>>, variables: string) => void;
}

interface SupplierContactMutationOptions<TVariables> {
  onSuccess?: (data: Awaited<ReturnType<typeof createSupplierContact>>, variables: TVariables) => void;
}

interface CreatePurchaseOrderMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof createPurchaseOrder>>, variables: CreatePurchaseOrderInput) => void;
}

interface UpdatePurchaseOrderMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof updatePurchaseOrder>>, variables: UpdatePurchaseOrderInput) => void;
}

interface ReceivePurchaseOrderMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof receivePurchaseOrder>>, variables: { orderId: string; input: ReceivePurchaseOrderInput; supplierId?: string }) => void;
}

export function useCreateSupplierMutation(options?: CreateSupplierMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSupplier,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: suppliersQueryKey });
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useUpdateSupplierMutation(options?: UpdateSupplierMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSupplier,
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: suppliersQueryKey }),
        queryClient.invalidateQueries({ queryKey: supplierDetailQueryKey(variables.id) }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useDeleteSupplierMutation(options?: DeleteSupplierMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: suppliersQueryKey });
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useCreateSupplierContactMutation(options?: SupplierContactMutationOptions<{ supplierId: string; input: CreateSupplierContactInput }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supplierId, input }: { supplierId: string; input: CreateSupplierContactInput }) => createSupplierContact(supplierId, input),
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: suppliersQueryKey }),
        queryClient.invalidateQueries({ queryKey: supplierDetailQueryKey(variables.supplierId) }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useUpdateSupplierContactMutation(options?: SupplierContactMutationOptions<{ supplierId: string; input: UpdateSupplierContactInput }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supplierId, input }: { supplierId: string; input: UpdateSupplierContactInput }) => updateSupplierContact(supplierId, input),
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: suppliersQueryKey }),
        queryClient.invalidateQueries({ queryKey: supplierDetailQueryKey(variables.supplierId) }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useDeleteSupplierContactMutation(options?: SupplierContactMutationOptions<{ supplierId: string; contactId: string }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supplierId, contactId }: { supplierId: string; contactId: string }) => deleteSupplierContact(supplierId, contactId),
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: suppliersQueryKey }),
        queryClient.invalidateQueries({ queryKey: supplierDetailQueryKey(variables.supplierId) }),
      ]);
      options?.onSuccess?.(data as Awaited<ReturnType<typeof createSupplierContact>>, variables);
    },
  });
}

export function useCreatePurchaseOrderMutation(options?: CreatePurchaseOrderMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: suppliersQueryKey }),
        queryClient.invalidateQueries({ queryKey: supplierDetailQueryKey(variables.supplierId) }),
        queryClient.invalidateQueries({ queryKey: purchaseOrdersQueryKey(variables.supplierId) }),
        queryClient.invalidateQueries({ queryKey: purchaseCreateContextQueryKey("create") }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useUpdatePurchaseOrderMutation(options?: UpdatePurchaseOrderMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePurchaseOrder,
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: suppliersQueryKey }),
        queryClient.invalidateQueries({ queryKey: supplierDetailQueryKey(variables.supplierId) }),
        queryClient.invalidateQueries({ queryKey: purchaseOrdersQueryKey(variables.supplierId) }),
        queryClient.invalidateQueries({ queryKey: purchaseOrderDetailQueryKey(variables.id, true) }),
        queryClient.invalidateQueries({ queryKey: purchaseOrderDetailQueryKey(variables.id, false) }),
        queryClient.invalidateQueries({ queryKey: purchaseCreateContextQueryKey("create") }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useReceivePurchaseOrderMutation(options?: ReceivePurchaseOrderMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: ReceivePurchaseOrderInput; supplierId?: string }) => receivePurchaseOrder(orderId, input),
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: suppliersQueryKey }),
        variables.supplierId ? queryClient.invalidateQueries({ queryKey: supplierDetailQueryKey(variables.supplierId) }) : Promise.resolve(),
        variables.supplierId ? queryClient.invalidateQueries({ queryKey: purchaseOrdersQueryKey(variables.supplierId) }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: purchaseOrderDetailQueryKey(variables.orderId, true) }),
        queryClient.invalidateQueries({ queryKey: purchaseOrderDetailQueryKey(variables.orderId, false) }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}
