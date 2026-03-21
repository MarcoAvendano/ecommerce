import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapPurchaseOrderRow,
  normalizeNullable,
  requireSuppliersRequest,
} from "@/app/api/_lib/suppliers";
import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderInput,
} from "@/features/suppliers/schemas";
import { computePurchaseOrderLineTotals, computePurchaseOrderTotals } from "@/features/suppliers/purchase-order.utils";
import type {
  PurchaseOrderMutationResponse,
  PurchaseOrdersListResponse,
} from "@/features/suppliers/suppliers.types";

async function validatePurchaseOrderItems(
  adminClient: ReturnType<typeof createAdminClient>,
  items: CreatePurchaseOrderInput["items"],
) {
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const variantIds = Array.from(new Set(items.flatMap((item) => item.variantId ? [item.variantId] : [])));
  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
    adminClient
      .from("products")
      .select("id, name, status, is_purchasable")
      .in("id", productIds)
      .is("deleted_at", null),
    variantIds.length > 0
      ? adminClient
          .from("product_variants")
          .select("id, product_id, name, sku, is_active")
          .in("id", variantIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsError || variantsError) {
    throw new Error(productsError?.message ?? variantsError?.message ?? "No se pudieron validar los productos de la compra.");
  }

  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const variantsById = new Map((variants ?? []).map((variant) => [variant.id, variant]));

  for (const item of items) {
    const product = productsById.get(item.productId);

    if (!product) {
      throw new Error("Uno de los productos seleccionados no existe.");
    }

    if (!product.is_purchasable || product.status !== "active") {
      throw new Error(`El producto ${product.name} no esta disponible para compras.`);
    }

    if (item.variantId) {
      const variant = variantsById.get(item.variantId);

      if (!variant || variant.product_id !== item.productId) {
        throw new Error("Una de las variantes seleccionadas no corresponde al producto indicado.");
      }

      if (!variant.is_active) {
        throw new Error(`La variante ${variant.name} no esta activa para compras.`);
      }
    }
  }
}

async function upsertProductSupplierLinks(
  adminClient: ReturnType<typeof createAdminClient>,
  supplierId: string,
  items: CreatePurchaseOrderInput["items"],
) {
  const uniqueItems = Array.from(new Map(items.map((item) => [`${item.productId}:${item.variantId ?? "product"}`, item])).values());

  for (const item of uniqueItems) {
    const query = adminClient
      .from("product_suppliers")
      .select("id")
      .eq("supplier_id", supplierId)
      .eq("product_id", item.productId);

    const existingQuery = item.variantId
      ? query.eq("variant_id", item.variantId)
      : query.is("variant_id", null);

    const { data: existing, error: existingError } = await existingQuery.maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existing) {
      const { error: updateError } = await adminClient
        .from("product_suppliers")
        .update({
          supplier_sku: normalizeNullable(item.supplierSku),
          last_cost_cents: item.unitCostCents,
        })
        .eq("id", existing.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      continue;
    }

    const { error: insertError } = await adminClient
      .from("product_suppliers")
      .insert({
        supplier_id: supplierId,
        product_id: item.productId,
        variant_id: item.variantId,
        supplier_sku: normalizeNullable(item.supplierSku),
        last_cost_cents: item.unitCostCents,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

export async function GET(request: Request) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const url = new URL(request.url);
  const supplierId = url.searchParams.get("supplierId");
  const adminClient = createAdminClient();
  const ordersQuery = adminClient
    .from("purchase_orders")
    .select("id, supplier_id, order_number, status, ordered_at, expected_at, subtotal_cents, discount_cents, tax_cents, total_cents, notes, created_at, updated_at")
    .order("ordered_at", { ascending: false });

  const { data: orders, error } = supplierId ? await ordersQuery.eq("supplier_id", supplierId) : await ordersQuery;

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudieron cargar las ordenes de compra." },
      { status: 500 },
    );
  }

  const orderIds = (orders ?? []).map((order) => order.id);
  const supplierIds = Array.from(new Set((orders ?? []).map((order) => order.supplier_id)));
  const itemCountsByOrderId = new Map<string, number>();
  const supplierNamesById = new Map<string, string>();

  if (supplierIds.length > 0) {
    const { data: suppliers, error: suppliersError } = await adminClient
      .from("suppliers")
      .select("id, name")
      .in("id", supplierIds);

    if (suppliersError) {
      return NextResponse.json(
        { message: suppliersError.message ?? "No se pudieron cargar los proveedores de las ordenes." },
        { status: 500 },
      );
    }

    for (const supplier of suppliers ?? []) {
      supplierNamesById.set(supplier.id, supplier.name);
    }
  }

  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await adminClient
      .from("purchase_order_items")
      .select("id, purchase_order_id")
      .in("purchase_order_id", orderIds);

    if (itemsError) {
      return NextResponse.json(
        { message: itemsError.message ?? "No se pudieron cargar las lineas de compra." },
        { status: 500 },
      );
    }

    for (const item of items ?? []) {
      itemCountsByOrderId.set(item.purchase_order_id, (itemCountsByOrderId.get(item.purchase_order_id) ?? 0) + 1);
    }
  }

  const responseBody: PurchaseOrdersListResponse = {
    orders: (orders ?? []).map((order) =>
      mapPurchaseOrderRow(
        { ...order, supplier_name: supplierNamesById.get(order.supplier_id) ?? null },
        itemCountsByOrderId.get(order.id) ?? 0,
      ),
    ),
  };

  return NextResponse.json(responseBody);
}

export async function POST(request: Request) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const payload = await request.json().catch(() => null);
  const parsedPayload = createPurchaseOrderSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: "Datos invalidos.", errors: parsedPayload.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const { authContext } = suppliersRequest;
  const input = parsedPayload.data;

  try {
    await validatePurchaseOrderItems(adminClient, input.items);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo validar la orden de compra." },
      { status: 400 },
    );
  }

  const totals = computePurchaseOrderTotals(input.items, input.discountCents);
  const { data: order, error: orderError } = await adminClient
    .from("purchase_orders")
    .insert({
      supplier_id: input.supplierId,
      status: input.status,
      ordered_at: input.orderedAt,
      expected_at: input.expectedAt || null,
      subtotal_cents: totals.subtotalCents,
      discount_cents: totals.discountCents,
      tax_cents: totals.taxCents,
      total_cents: totals.totalCents,
      notes: normalizeNullable(input.notes),
      created_by: authContext.user.id,
    })
    .select("id, supplier_id, order_number, status, ordered_at, expected_at, subtotal_cents, discount_cents, tax_cents, total_cents, notes, created_at, updated_at")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { message: orderError?.message ?? "No se pudo crear la orden de compra." },
      { status: 400 },
    );
  }

  const orderItems = input.items.map((item) => {
    const line = computePurchaseOrderLineTotals(item);

    return {
      purchase_order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      ordered_qty: item.orderedQty,
      unit_cost_cents: item.unitCostCents,
      tax_rate: item.taxRate,
      line_total_cents: line.totalCents,
    };
  });

  const { error: itemsError } = await adminClient.from("purchase_order_items").insert(orderItems);

  if (itemsError) {
    await adminClient.from("purchase_orders").delete().eq("id", order.id);
    return NextResponse.json(
      { message: itemsError.message ?? "No se pudieron guardar las lineas de compra." },
      { status: 400 },
    );
  }

  try {
    await upsertProductSupplierLinks(adminClient, input.supplierId, input.items);
  } catch (error) {
    await adminClient.from("purchase_order_items").delete().eq("purchase_order_id", order.id);
    await adminClient.from("purchase_orders").delete().eq("id", order.id);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo relacionar el proveedor con los productos." },
      { status: 400 },
    );
  }

  const { data: supplier } = await adminClient
    .from("suppliers")
    .select("name")
    .eq("id", input.supplierId)
    .maybeSingle();

  const responseBody: PurchaseOrderMutationResponse = {
    message: "Orden de compra creada correctamente.",
    order: mapPurchaseOrderRow({ ...order, supplier_name: supplier?.name ?? null }, input.items.length),
  };

  return NextResponse.json(responseBody, { status: 201 });
}
