import type { Database, Json } from "../../../types/supabase";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
type InventoryLocationRow = Database["public"]["Tables"]["inventory_locations"]["Row"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
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

export interface BrandOption {
  id: BrandRow["id"];
  name: BrandRow["name"];
  slug: BrandRow["slug"];
}

export interface ProductImageItem {
  id: ProductImageRow["id"];
  productId: ProductImageRow["product_id"];
  variantId: ProductImageRow["variant_id"];
  storagePath: ProductImageRow["storage_path"];
  altText: ProductImageRow["alt_text"];
  sortOrder: ProductImageRow["sort_order"];
  createdAt: ProductImageRow["created_at"];
  publicUrl: string;
}

export interface ProductOptionGroupValueItem {
  id?: string;
  optionGroupId?: string;
  value: string;
  sortOrder: number;
}

export interface ProductOptionGroupItem {
  id?: string;
  productId?: string;
  name: string;
  sortOrder: number;
  values: ProductOptionGroupValueItem[];
}

export interface ProductOptionSelectionItem {
  groupId: string;
  groupName: string;
  valueId: string;
  value: string;
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
  brandId: ProductRow["brand_id"];
  trackInventory: ProductRow["track_inventory"];
  isSellable: ProductRow["is_sellable"];
  isPurchasable: ProductRow["is_purchasable"];
  baseUnit: ProductRow["base_unit"];
  imageUrl: ProductRow["image_url"];
  storeId: string | null;
  brand: BrandOption | null;
  categories: CategoryOption[];
  images: ProductImageItem[];
  optionGroups: ProductOptionGroupItem[];
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
  optionSelections: ProductOptionSelectionItem[];
  unitValue: ProductVariantRow["unit_value"];
  unitLabel: ProductVariantRow["unit_label"];
  packSize: ProductVariantRow["pack_size"];
  volumeMl: ProductVariantRow["volume_ml"];
  abv: ProductVariantRow["abv"];
  inventoryBalances: VariantInventoryBalanceItem[];
  createdAt: ProductVariantRow["created_at"];
  updatedAt: ProductVariantRow["updated_at"];
}

export interface ProductEditorBootstrapResponse {
  categories: CategoryOption[];
  stores: InventoryLocationOption[];
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

export interface SaveProductVariantsPayload {
  optionGroups: Array<{
    id?: string;
    name: string;
    sortOrder: number;
    values: Array<{
      id?: string;
      value: string;
      sortOrder: number;
    }>;
  }>;
  variants: Array<{
    id?: string;
    name: string;
    sku: string;
    barcode?: string;
    priceCents: number;
    compareAtPriceCents: number | null;
    costCents: number;
    initialStockQty: number;
    isActive: boolean;
    optionSelections: ProductOptionSelectionItem[];
  }>;
}

export interface SaveProductVariantsResponse {
  message: string;
}
