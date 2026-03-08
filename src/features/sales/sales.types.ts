import type { Database } from "../../../types/supabase";

type InventoryLocationRow = Database["public"]["Tables"]["inventory_locations"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export interface SalesLocationOption {
  id: InventoryLocationRow["id"];
  code: InventoryLocationRow["code"];
  name: InventoryLocationRow["name"];
  locationType: InventoryLocationRow["location_type"];
}

export interface SalesCustomerOption {
  id: CustomerRow["id"];
  fullName: CustomerRow["full_name"];
  email: CustomerRow["email"];
  phone: CustomerRow["phone"];
}

export interface SalesProductVariantOption {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productStatus: string;
  trackInventory: boolean;
  isSellable: boolean;
  variantName: string;
  sku: string;
  barcode: string | null;
  priceCents: number;
  isDefault: boolean;
  isActive: boolean;
  availableQtyByLocation: Record<string, number>;
}

export interface SalesCreateContextResponse {
  locations: SalesLocationOption[];
  customers: SalesCustomerOption[];
  variants: SalesProductVariantOption[];
}

export interface CreateSalesOrderResponse {
  message: string;
  order: {
    id: OrderRow["id"];
    orderNumber: OrderRow["order_number"];
    totalCents: OrderRow["total_cents"];
    status: OrderRow["status"];
  };
}
