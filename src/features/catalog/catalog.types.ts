import type { Database } from "../../../types/supabase";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type InventoryLocationRow = Database["public"]["Tables"]["inventory_locations"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface InventoryLocationOption {
  id: InventoryLocationRow["id"];
  code: InventoryLocationRow["code"];
  name: InventoryLocationRow["name"];
  locationType: InventoryLocationRow["location_type"];
}

export interface VariantInventoryBalanceItem {
  locationId: InventoryLocationRow["id"];
  locationName: InventoryLocationRow["name"];
  locationCode: InventoryLocationRow["code"];
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
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
  variants: ProductVariantListItem[];
  createdAt: ProductRow["created_at"];
  updatedAt: ProductRow["updated_at"];
}

export interface ProductVariantListItem {
  id: ProductVariantRow["id"];
  productId: ProductVariantRow["product_id"];
  name: ProductVariantRow["name"];
  sku: ProductVariantRow["sku"];
  barcode: ProductVariantRow["barcode"];
  priceCents: ProductVariantRow["price_cents"];
  compareAtPriceCents: ProductVariantRow["compare_at_price_cents"];
  costCents: ProductVariantRow["cost_cents"];
  isDefault: ProductVariantRow["is_default"];
  isActive: ProductVariantRow["is_active"];
  optionValues: ProductVariantRow["option_values"];
  unitValue: ProductVariantRow["unit_value"];
  unitLabel: ProductVariantRow["unit_label"];
  packSize: ProductVariantRow["pack_size"];
  volumeMl: ProductVariantRow["volume_ml"];
  abv: ProductVariantRow["abv"];
  inventoryBalances: VariantInventoryBalanceItem[];
  createdAt: ProductVariantRow["created_at"];
  updatedAt: ProductVariantRow["updated_at"];
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
