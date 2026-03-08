import { useQuery } from "@tanstack/react-query";
import {
  getProductById,
  getProductEditorBootstrap,
  listCategories,
  listInventoryLocations,
  listProducts,
} from "@/features/catalog/catalog.api";

export const catalogBootstrapQueryKey = ["catalog", "bootstrap"] as const;
export const categoriesQueryKey = ["catalog", "categories"] as const;
export const inventoryLocationsQueryKey = ["catalog", "inventory-locations"] as const;
export const productsQueryKey = ["catalog", "products"] as const;
export const productDetailQueryKey = (productId: string) => ["catalog", "products", productId] as const;

export function useCatalogBootstrapQuery() {
  return useQuery({
    queryKey: catalogBootstrapQueryKey,
    queryFn: getProductEditorBootstrap,
  });
}

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

export function useProductDetailQuery(productId: string, enabled = true) {
  return useQuery({
    queryKey: productDetailQueryKey(productId),
    queryFn: () => getProductById(productId),
    enabled,
  });
}
