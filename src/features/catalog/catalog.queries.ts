import { useQuery } from "@tanstack/react-query";
import { listCategories, listProducts } from "@/features/catalog/catalog.api";

export const categoriesQueryKey = ["catalog", "categories"] as const;
export const productsQueryKey = ["catalog", "products"] as const;

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: listCategories,
  });
}

export function useProductsQuery() {
  return useQuery({
    queryKey: productsQueryKey,
    queryFn: listProducts,
  });
}