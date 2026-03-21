import type { Database } from "../../../types/supabase";

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
type SupplierContactRow = Database["public"]["Tables"]["supplier_contacts"]["Row"];
type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];
type PurchaseOrderItemRow = Database["public"]["Tables"]["purchase_order_items"]["Row"];
type InventoryLocationRow = Database["public"]["Tables"]["inventory_locations"]["Row"];
type InventoryMovementRow = Database["public"]["Tables"]["inventory_movements"]["Row"];

export type PurchaseOrderStatus = PurchaseOrderRow["status"];
export type InventoryMovementType = InventoryMovementRow["movement_type"];

export interface SupplierAddressItem {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SupplierListItem {
  id: SupplierRow["id"];
  name: SupplierRow["name"];
  email: SupplierRow["email"];
  phone: SupplierRow["phone"];
  taxId: SupplierRow["tax_id"];
  paymentTermsDays: SupplierRow["payment_terms_days"];
  isActive: SupplierRow["is_active"];
  address: SupplierAddressItem;
  createdAt: SupplierRow["created_at"];
  updatedAt: SupplierRow["updated_at"];
}

export interface SuppliersListResponse {
  suppliers: SupplierListItem[];
}

export interface SupplierContactItem {
  id: SupplierContactRow["id"];
  supplierId: SupplierContactRow["supplier_id"];
  fullName: SupplierContactRow["full_name"];
  email: SupplierContactRow["email"];
  phone: SupplierContactRow["phone"];
  role: SupplierContactRow["role"];
  createdAt: SupplierContactRow["created_at"];
  updatedAt: SupplierContactRow["updated_at"];
}

export interface PurchaseOrderListItem {
  id: PurchaseOrderRow["id"];
  supplierId: PurchaseOrderRow["supplier_id"];
  supplierName: string;
  orderNumber: PurchaseOrderRow["order_number"];
  status: PurchaseOrderStatus;
  orderedAt: PurchaseOrderRow["ordered_at"];
  expectedAt: PurchaseOrderRow["expected_at"];
  subtotalCents: PurchaseOrderRow["subtotal_cents"];
  discountCents: PurchaseOrderRow["discount_cents"];
  taxCents: PurchaseOrderRow["tax_cents"];
  totalCents: PurchaseOrderRow["total_cents"];
  notes: PurchaseOrderRow["notes"];
  itemCount: number;
  createdAt: PurchaseOrderRow["created_at"];
  updatedAt: PurchaseOrderRow["updated_at"];
}

export interface PurchaseOrderItemDetail {
  id: PurchaseOrderItemRow["id"];
  productId: PurchaseOrderItemRow["product_id"];
  variantId: PurchaseOrderItemRow["variant_id"];
  productName: string;
  variantName: string | null;
  sku: string;
  orderedQty: PurchaseOrderItemRow["ordered_qty"];
  receivedQty: PurchaseOrderItemRow["received_qty"];
  pendingQty: number;
  unitCostCents: PurchaseOrderItemRow["unit_cost_cents"];
  taxRate: PurchaseOrderItemRow["tax_rate"];
  lineTotalCents: PurchaseOrderItemRow["line_total_cents"];
  supplierSku: string | null;
}

export interface InventoryMovementHistoryItem {
  id: InventoryMovementRow["id"];
  movementType: InventoryMovementType;
  quantity: InventoryMovementRow["quantity"];
  unitCostCents: InventoryMovementRow["unit_cost_cents"];
  referenceType: InventoryMovementRow["reference_type"];
  referenceId: InventoryMovementRow["reference_id"];
  notes: InventoryMovementRow["notes"];
  movedAt: InventoryMovementRow["moved_at"];
  movedBy: {
    id: string | null;
    fullName: string | null;
    email: string | null;
  };
  location: {
    id: InventoryLocationRow["id"];
    code: InventoryLocationRow["code"];
    name: InventoryLocationRow["name"];
  };
  product: {
    id: string;
    name: string;
  };
  variant: {
    id: string | null;
    name: string | null;
    sku: string;
  };
}

export interface SupplierDetailItem extends SupplierListItem {
  contacts: SupplierContactItem[];
  purchaseOrders: PurchaseOrderListItem[];
  recentMovements: InventoryMovementHistoryItem[];
}

export interface SupplierDetailResponse {
  supplier: SupplierDetailItem;
}

export interface SupplierMutationResponse {
  message: string;
  supplier: SupplierListItem;
}

export interface DeleteSupplierResponse {
  message: string;
}

export interface SupplierContactMutationResponse {
  message: string;
  contact: SupplierContactItem;
}

export interface DeleteSupplierContactResponse {
  message: string;
}

export interface PurchaseOrdersListResponse {
  orders: PurchaseOrderListItem[];
}

export interface PurchaseOrderDetail {
  id: PurchaseOrderRow["id"];
  supplier: SupplierListItem;
  orderNumber: PurchaseOrderRow["order_number"];
  status: PurchaseOrderStatus;
  orderedAt: PurchaseOrderRow["ordered_at"];
  expectedAt: PurchaseOrderRow["expected_at"];
  subtotalCents: PurchaseOrderRow["subtotal_cents"];
  discountCents: PurchaseOrderRow["discount_cents"];
  taxCents: PurchaseOrderRow["tax_cents"];
  totalCents: PurchaseOrderRow["total_cents"];
  notes: PurchaseOrderRow["notes"];
  createdAt: PurchaseOrderRow["created_at"];
  updatedAt: PurchaseOrderRow["updated_at"];
  items: PurchaseOrderItemDetail[];
  movements: InventoryMovementHistoryItem[];
}

export interface PurchaseOrderDetailResponse {
  order: PurchaseOrderDetail;
}

export interface PurchaseOrderMutationResponse {
  message: string;
  order: PurchaseOrderListItem;
}

export interface PurchaseOrderReceiptResponse {
  message: string;
  orderId: string;
}

export interface PurchaseLocationOption {
  id: InventoryLocationRow["id"];
  code: InventoryLocationRow["code"];
  name: InventoryLocationRow["name"];
  locationType: InventoryLocationRow["location_type"];
}

export interface PurchaseProductVariantOption {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string;
  defaultCostCents: number;
  isActive: boolean;
}

export interface PurchaseCreateContextResponse {
  locations: PurchaseLocationOption[];
  variants: PurchaseProductVariantOption[];
}
