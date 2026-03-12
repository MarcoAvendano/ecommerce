import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { salesOrderIdSchema } from "@/features/sales/schemas";
import type {
  SalesOrderDetailAddress,
  SalesOrderDetailItem,
  SalesOrderDetailResponse,
  SalesStatus,
} from "@/features/sales/sales.types";

type ShippingAddressInput = {
  label?: unknown;
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  state?: unknown;
  postalCode?: unknown;
  postal_code?: unknown;
  country?: unknown;
};

type CustomerRelation = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type NamedRelation = {
  name: string | null;
};

async function requireSalesRequest() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return {
      error: NextResponse.json({ message: "No autenticado." }, { status: 401 }),
    };
  }

  const isAllowed = authContext.isAdmin || (await hasAnyRole(["manager", "cashier"]));

  if (!isAllowed) {
    return {
      error: NextResponse.json({ message: "No autorizado." }, { status: 403 }),
    };
  }

  return { authContext };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeShippingAddress(value: unknown): SalesOrderDetailAddress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const address = value as ShippingAddressInput;

  if (!isNonEmptyString(address.line1) || !isNonEmptyString(address.city) || !isNonEmptyString(address.country)) {
    return null;
  }

  return {
    label: isNonEmptyString(address.label) ? address.label : null,
    line1: address.line1,
    line2: isNonEmptyString(address.line2) ? address.line2 : null,
    city: address.city,
    state: isNonEmptyString(address.state) ? address.state : null,
    postalCode: isNonEmptyString(address.postalCode)
      ? address.postalCode
      : isNonEmptyString(address.postal_code)
        ? address.postal_code
        : null,
    country: address.country,
  };
}

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeSalesStatus(status: string): SalesStatus {
  switch (status) {
    case "paid":
    case "pending":
    case "draft":
    case "cancelled":
    case "fulfilled":
    case "refunded":
      return status;
    default:
      return "draft";
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const salesRequest = await requireSalesRequest();

  if (salesRequest.error) {
    return salesRequest.error;
  }

  const { orderId } = await params;
  const parsedOrderId = salesOrderIdSchema.safeParse(orderId);

  if (!parsedOrderId.success) {
    return NextResponse.json({ message: "La orden es invalida." }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const [orderResult, itemsResult, paymentResult] = await Promise.all([
    adminClient
      .from("orders")
      .select("id, order_number, created_at, status, currency, sales_channel, notes, subtotal_cents, discount_cents, tax_cents, total_cents, shipping_address, customer:customers(id, full_name, email, phone)")
      .eq("id", parsedOrderId.data)
      .maybeSingle(),
    adminClient
      .from("order_items")
      .select("id, order_id, product_id, variant_id, item_name, sku, quantity, unit_price_cents, discount_cents, tax_cents, line_total_cents, product:products(name), variant:product_variants(name)")
      .eq("order_id", parsedOrderId.data)
      .order("id", { ascending: true }),
    adminClient
      .from("order_payments")
      .select("payment_method")
      .eq("order_id", parsedOrderId.data)
      .order("paid_at", { ascending: false })
      .limit(1),
  ]);

  if (orderResult.error) {
    return NextResponse.json(
      { message: orderResult.error.message ?? "No se pudo cargar la orden." },
      { status: 500 },
    );
  }

  if (!orderResult.data) {
    return NextResponse.json({ message: "La orden no existe." }, { status: 404 });
  }

  if (itemsResult.error) {
    return NextResponse.json(
      { message: itemsResult.error.message ?? "No se pudieron cargar los items de la orden." },
      { status: 500 },
    );
  }

  if (paymentResult.error) {
    return NextResponse.json(
      { message: paymentResult.error.message ?? "No se pudo cargar el pago de la orden." },
      { status: 500 },
    );
  }

  const items: SalesOrderDetailItem[] = (itemsResult.data ?? []).map((item) => {
    const product = getSingleRelation<NamedRelation>(item.product);
    const variant = getSingleRelation<NamedRelation>(item.variant);

    return {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      productName: product?.name ?? item.item_name,
      variantName: variant?.name ?? null,
      itemName: item.item_name,
      sku: item.sku,
      quantity: Number(item.quantity),
      unitPriceCents: item.unit_price_cents,
      discountCents: item.discount_cents,
      taxCents: item.tax_cents,
      subtotalCents: item.line_total_cents,
    };
  });

  const customer = getSingleRelation<CustomerRelation>(orderResult.data.customer);

  const responseBody: SalesOrderDetailResponse = {
    order: {
      id: orderResult.data.id,
      orderNumber: orderResult.data.order_number,
      createdAt: orderResult.data.created_at,
      status: normalizeSalesStatus(orderResult.data.status),
      currency: orderResult.data.currency,
      salesChannel: orderResult.data.sales_channel,
      notes: orderResult.data.notes,
      subtotalCents: orderResult.data.subtotal_cents,
      discountCents: orderResult.data.discount_cents,
      taxCents: orderResult.data.tax_cents,
      totalCents: orderResult.data.total_cents,
      customer: customer
        ? {
            id: customer.id,
            fullName: customer.full_name,
            email: customer.email,
            phone: customer.phone,
          }
        : null,
      shippingAddress: normalizeShippingAddress(orderResult.data.shipping_address),
      paymentMethod: paymentResult.data?.[0]?.payment_method ?? null,
      items,
    },
  };

  return NextResponse.json(responseBody);
}