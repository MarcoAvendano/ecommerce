import type { Database } from "../../../types/supabase";

type InventoryLocationRow = Database["public"]["Tables"]["inventory_locations"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export type SalesStatus = "paid" | "pending" | "draft" | "cancelled" | "fulfilled" | "refunded";

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
    status: SalesStatus;
  };
}

export interface SalesOrderListItem {
  id: OrderRow["id"];
  orderNumber: OrderRow["order_number"];
  totalCents: OrderRow["total_cents"];
  status: SalesStatus;
  createdAt: OrderRow["created_at"];
}

export interface SalesOrderListResponse {
  sales: SalesOrderListItem[];
}

export interface SalesOrderDetailCustomer {
  id: CustomerRow["id"];
  fullName: string | null;
  email: string | null;
  phone: string | null;
}

export interface SalesOrderDetailAddress {
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
}

export interface SalesOrderDetailItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  itemName: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  subtotalCents: number;
}

export interface SalesOrderDetail {
  id: OrderRow["id"];
  orderNumber: OrderRow["order_number"];
  createdAt: OrderRow["created_at"];
  status: SalesStatus;
  currency: OrderRow["currency"];
  salesChannel: OrderRow["sales_channel"];
  notes: OrderRow["notes"];
  subtotalCents: OrderRow["subtotal_cents"];
  discountCents: OrderRow["discount_cents"];
  taxCents: OrderRow["tax_cents"];
  totalCents: OrderRow["total_cents"];
  customer: SalesOrderDetailCustomer | null;
  shippingAddress: SalesOrderDetailAddress | null;
  paymentMethod: string | null;
  items: SalesOrderDetailItem[];
}

export interface SalesOrderDetailResponse {
  order: SalesOrderDetail;
}

export interface SalesCustomerAddressOption {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

export interface CustomerAddressesResponse {
  addresses: SalesCustomerAddressOption[];
}
