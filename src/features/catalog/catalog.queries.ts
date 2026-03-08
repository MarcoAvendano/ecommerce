import { useQuery } from "@tanstack/react-query";
import { listCategories, listInventoryLocations, listProducts } from "@/features/catalog/catalog.api";

export const categoriesQueryKey = ["catalog", "categories"] as const;
export const inventoryLocationsQueryKey = ["catalog", "inventory-locations"] as const;
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

export function useInventoryLocationsQuery() {
  return useQuery({
    queryKey: inventoryLocationsQueryKey,
    queryFn: listInventoryLocations,
  });
}
