import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSalesOrderSchema } from "@/features/sales/schemas";
import type { CreateSalesOrderResponse } from "@/features/sales/sales.types";
import { map } from "lodash";

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

async function loadSalesOrders(adminClient: ReturnType<typeof createAdminClient>) {
  return Promise.resolve(
    adminClient
      .from("orders")
      .select("id, order_number, total_cents, status, created_at")
      .order("created_at", { ascending: false }),
  );
}

export async function POST(request: Request) {
  const salesRequest = await requireSalesRequest();

  if (salesRequest.error) {
    return salesRequest.error;
  }

  const payload = await request.json();
  const parsedPayload = createSalesOrderSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        message: "Datos invalidos.",
        errors: parsedPayload.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const { authContext } = salesRequest;
  const {
    locationId,
    paymentMethod,
    notes,
    discountDollars,
    customerId,
    requiresShipping,
    shippingAddressId,
    items,
  } = parsedPayload.data;

  const orderDiscountCents = Math.round(discountDollars * 100);

  const rpcItems = items.map((item) => ({
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
    discount_cents: Math.round(item.discountDollars * 100),
    tax_cents: 0,
  }));

  let shippingAddress: Record<string, unknown> | null = null;

  if (requiresShipping && shippingAddressId && customerId) {
    const { data: address, error: addressError } = await adminClient
      .from("customer_addresses")
      .select("label, line1, line2, city, state, postal_code, country")
      .eq("id", shippingAddressId)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (addressError || !address) {
      return NextResponse.json(
        { message: "No se pudo cargar la direccion de envio seleccionada." },
        { status: 400 },
      );
    }

    shippingAddress = {
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
    };
  }

  const { data: orderId, error: createOrderError } = await adminClient.rpc("confirm_pos_sale", {
    p_location_id: locationId,
    p_created_by: authContext.user.id,
    p_items: rpcItems,
    p_payment_method: paymentMethod,
    p_customer_id: customerId ?? undefined,
    p_notes: notes.trim() || null,
    p_order_discount_cents: orderDiscountCents,
    p_shipping_address: shippingAddress ?? undefined,
  });

  if (createOrderError || !orderId) {
    return NextResponse.json(
      { message: createOrderError?.message ?? "No se pudo confirmar la venta." },
      { status: 400 },
    );
  }

  const { data: createdOrder, error: loadOrderError } = await adminClient
    .from("orders")
    .select("id, order_number, total_cents, status")
    .eq("id", orderId)
    .maybeSingle();

  if (loadOrderError || !createdOrder) {
    return NextResponse.json(
      { message: loadOrderError?.message ?? "La venta se creo pero no se pudo cargar el resumen." },
      { status: 500 },
    );
  }

  const responseBody: CreateSalesOrderResponse = {
    message: "Venta registrada correctamente.",
    order: {
      id: createdOrder.id,
      orderNumber: createdOrder.order_number,
      totalCents: createdOrder.total_cents,
      status: createdOrder.status,
    },
  };

  return NextResponse.json(responseBody, { status: 201 });
}

export async function GET() {
  const salesRequest = await requireSalesRequest();

  if (salesRequest.error) {
    return salesRequest.error;
  }

  const adminClient = createAdminClient();
  const { data: rows, error } = await loadSalesOrders(adminClient);

  if (error || !rows) {
    return NextResponse.json(
      { message: error?.message ?? "No se pudieron cargar las ordenes." },
      { status: 500 },
    );
  }

  const responseBody = {
    sales: map(rows, (row) => ({
      id: row.id,
      orderNumber: row.order_number,
      totalCents: row.total_cents,
      status: row.status,
      createdAt: row.created_at,
    })),
  };

  return NextResponse.json(responseBody);
}
