import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  createProduct,
  saveProductVariants,
  updateCategory,
  updateProduct,
} from "@/features/catalog/catalog.api";
import {
  categoriesQueryKey,
  productDetailQueryKey,
  productsQueryKey,
} from "@/features/catalog/catalog.queries";
import type { SaveProductVariantsPayload } from "@/features/catalog/catalog.types";
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

interface SaveProductVariantsMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof saveProductVariants>>, variables: { productId: string; input: SaveProductVariantsPayload }) => void;
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

export function useSaveProductVariantsMutation(options?: SaveProductVariantsMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: SaveProductVariantsPayload }) =>
      saveProductVariants(productId, input),
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKey }),
        queryClient.invalidateQueries({ queryKey: productDetailQueryKey(variables.productId) }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}
