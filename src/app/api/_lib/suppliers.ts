import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import type { Json } from "../../../../types/supabase";
import type {
  InventoryMovementHistoryItem,
  PurchaseOrderItemDetail,
  PurchaseOrderListItem,
  SupplierAddressItem,
  SupplierContactItem,
  SupplierListItem,
} from "@/features/suppliers/suppliers.types";

export function normalizeNullable(value: string | null | undefined) {
  const trimmedValue = value?.trim() ?? "";
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function parseSupplierAddress(address: Json | null | undefined): SupplierAddressItem {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    return {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    };
  }

  const source = address as Record<string, unknown>;

  return {
    line1: typeof source.line1 === "string" ? source.line1 : "",
    line2: typeof source.line2 === "string" ? source.line2 : "",
    city: typeof source.city === "string" ? source.city : "",
    state: typeof source.state === "string" ? source.state : "",
    postalCode: typeof source.postalCode === "string" ? source.postalCode : "",
    country: typeof source.country === "string" ? source.country : "",
  };
}

export function buildSupplierAddress(address: SupplierAddressItem): Record<string, Json> {
  return {
    line1: address.line1.trim(),
    line2: address.line2.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.postalCode.trim(),
    country: address.country.trim(),
  };
}

export function mapSupplierRow(row: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  payment_terms_days: number;
  is_active: boolean;
  address: Json | null;
  created_at: string;
  updated_at: string;
}): SupplierListItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    taxId: row.tax_id,
    paymentTermsDays: row.payment_terms_days,
    isActive: row.is_active,
    address: parseSupplierAddress(row.address),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSupplierContactRow(row: {
  id: string;
  supplier_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}): SupplierContactItem {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPurchaseOrderRow(row: {
  id: string;
  supplier_id: string;
  order_number: string;
  status: string;
  ordered_at: string;
  expected_at: string | null;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier_name?: string | null;
}, itemCount: number): PurchaseOrderListItem {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name ?? "Proveedor",
    orderNumber: row.order_number,
    status: row.status,
    orderedAt: row.ordered_at,
    expectedAt: row.expected_at,
    subtotalCents: row.subtotal_cents,
    discountCents: row.discount_cents,
    taxCents: row.tax_cents,
    totalCents: row.total_cents,
    notes: row.notes,
    itemCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPurchaseOrderItemRow(row: {
  id: string;
  product_id: string;
  variant_id: string | null;
  ordered_qty: number;
  received_qty: number;
  unit_cost_cents: number;
  tax_rate: number;
  line_total_cents: number;
}, related: {
  productName: string;
  variantName: string | null;
  sku: string;
  supplierSku: string | null;
}): PurchaseOrderItemDetail {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    productName: related.productName,
    variantName: related.variantName,
    sku: related.sku,
    orderedQty: row.ordered_qty,
    receivedQty: row.received_qty,
    pendingQty: Math.max(0, row.ordered_qty - row.received_qty),
    unitCostCents: row.unit_cost_cents,
    taxRate: row.tax_rate,
    lineTotalCents: row.line_total_cents,
    supplierSku: related.supplierSku,
  };
}

export function mapInventoryMovementRow(row: {
  id: string;
  movement_type: string;
  quantity: number;
  unit_cost_cents: number | null;
  reference_type: string;
  reference_id: string | null;
  notes: string | null;
  moved_at: string;
  moved_by: string | null;
  location_id: string;
  product_id: string;
  variant_id: string | null;
}, related: {
  movedByName: string | null;
  movedByEmail: string | null;
  locationCode: string;
  locationName: string;
  productName: string;
  variantName: string | null;
  variantSku: string;
}): InventoryMovementHistoryItem {
  return {
    id: row.id,
    movementType: row.movement_type,
    quantity: row.quantity,
    unitCostCents: row.unit_cost_cents,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    notes: row.notes,
    movedAt: row.moved_at,
    movedBy: {
      id: row.moved_by,
      fullName: related.movedByName,
      email: related.movedByEmail,
    },
    location: {
      id: row.location_id,
      code: related.locationCode,
      name: related.locationName,
    },
    product: {
      id: row.product_id,
      name: related.productName,
    },
    variant: {
      id: row.variant_id,
      name: related.variantName,
      sku: related.variantSku,
    },
  };
}

export async function requireSuppliersRequest() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return {
      error: NextResponse.json({ message: "No autenticado." }, { status: 401 }),
    };
  }

  const isAllowed = authContext.isAdmin || (await hasAnyRole(["manager", "inventory"]));

  if (!isAllowed) {
    return {
      error: NextResponse.json({ message: "No autorizado." }, { status: 403 }),
    };
  }

  return { authContext };
}
