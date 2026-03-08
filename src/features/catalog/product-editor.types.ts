import type {
  CategoryOption,
  InventoryLocationOption,
  ProductImageItem,
  ProductListItem,
  ProductOptionGroupItem,
} from "@/features/catalog/catalog.types";

export interface ProductEditorBootstrapData {
  categories: CategoryOption[];
  stores: InventoryLocationOption[];
}

export interface ProductEditorInitialData {
  product?: ProductListItem | null;
  bootstrap: ProductEditorBootstrapData;
}

export interface LocalProductImageItem {
  id?: string;
  file?: File;
  publicUrl: string;
  storagePath?: string;
  altText: string;
  sortOrder: number;
}

export interface ProductOptionSelectionInput {
  groupId: string;
  groupName: string;
  valueId: string;
  value: string;
}

export interface ProductVariantDrawerValues {
  id?: string;
  name: string;
  sku: string;
  barcode?: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  costCents: number;
  initialStockQty: number;
  isActive: boolean;
  optionSelections: ProductOptionSelectionInput[];
}

export interface ProductEditorValues {
  name: string;
  slug: string;
  sku: string;
  description: string;
  status: "draft" | "active" | "archived";
  categoryIds: string[];
  storeId: string | null;
  trackInventory: boolean;
  imageUrl: string;
  imageFile: File | null;
  additionalImages: LocalProductImageItem[];
  optionGroups: ProductOptionGroupItem[];
  variants: ProductVariantDrawerValues[];
}
