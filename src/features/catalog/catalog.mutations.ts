import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  createProduct,
  deleteProductVariant,
  saveProductOptionGroups,
  saveProductVariant,
  updateCategory,
  updateProduct,
} from "@/features/catalog/catalog.api";
import {
  categoriesQueryKey,
  productDetailQueryKey,
  productsQueryKey,
} from "@/features/catalog/catalog.queries";
import type {
  SaveProductOptionGroupsPayload,
  SaveProductVariantPayload,
} from "@/features/catalog/catalog.types";
import type {
  CreateCategoryInput,
  CreateProductInput,
  UpdateCategoryInput,
  UpdateProductInput,
} from "@/features/catalog/schemas";

interface CreateCategoryMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof createCategory>>, variables: CreateCategoryInput) => void;
}

interface CreateProductMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof createProduct>>, variables: CreateProductInput) => void;
}

interface UpdateCategoryMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof updateCategory>>, variables: UpdateCategoryInput) => void;
}

interface UpdateProductMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof updateProduct>>, variables: UpdateProductInput) => void;
}

interface SaveProductOptionGroupsMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof saveProductOptionGroups>>, variables: { productId: string; input: SaveProductOptionGroupsPayload }) => void;
}

interface SaveProductVariantMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof saveProductVariant>>, variables: { productId: string; input: SaveProductVariantPayload }) => void;
}

interface DeleteProductVariantMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof deleteProductVariant>>, variables: { productId: string; variantId: string }) => void;
}

export function useCreateCategoryMutation(options?: CreateCategoryMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useCreateProductMutation(options?: CreateProductMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKey }),
        queryClient.invalidateQueries({ queryKey: categoriesQueryKey }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useUpdateCategoryMutation(options?: UpdateCategoryMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useUpdateProductMutation(options?: UpdateProductMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKey }),
        queryClient.invalidateQueries({ queryKey: categoriesQueryKey }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useSaveProductOptionGroupsMutation(options?: SaveProductOptionGroupsMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: SaveProductOptionGroupsPayload }) =>
      saveProductOptionGroups(productId, input),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: productDetailQueryKey(variables.productId) });
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useSaveProductVariantMutation(options?: SaveProductVariantMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: SaveProductVariantPayload }) =>
      saveProductVariant(productId, input),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: productDetailQueryKey(variables.productId) });
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useDeleteProductVariantMutation(options?: DeleteProductVariantMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
      deleteProductVariant(productId, variantId),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: productDetailQueryKey(variables.productId) });
      options?.onSuccess?.(data, variables);
    },
  });
}
