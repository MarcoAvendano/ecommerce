import type { Database } from "@/types/supabase";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryListItem {
  id: CategoryRow["id"];
  name: CategoryRow["name"];
  slug: CategoryRow["slug"];
  description: CategoryRow["description"];
  parentId: CategoryRow["parent_id"];
  parentName: string | null;
  sortOrder: CategoryRow["sort_order"];
  isActive: CategoryRow["is_active"];
  createdAt: CategoryRow["created_at"];
  updatedAt: CategoryRow["updated_at"];
}

export interface CategoriesListResponse {
  categories: CategoryListItem[];
}

export interface CreateCategoryResponse {
  message: string;
}

export interface UpdateCategoryResponse {
  message: string;
}

export interface ProductListItem {
  id: ProductRow["id"];
  name: ProductRow["name"];
  slug: ProductRow["slug"];
  sku: ProductRow["sku"];
  description: ProductRow["description"];
  status: ProductRow["status"];
  productType: ProductRow["product_type"];
  trackInventory: ProductRow["track_inventory"];
  isSellable: ProductRow["is_sellable"];
  isPurchasable: ProductRow["is_purchasable"];
  baseUnit: ProductRow["base_unit"];
  imageUrl: ProductRow["image_url"];
  categories: CategoryOption[];
  createdAt: ProductRow["created_at"];
  updatedAt: ProductRow["updated_at"];
}

export interface ProductsListResponse {
  products: ProductListItem[];
}

export interface CreateProductResponse {
  message: string;
}

export interface UpdateProductResponse {
  message: string;
}

export interface UploadProductImageResponse {
  message: string;
  path: string;
  publicUrl: string;
}