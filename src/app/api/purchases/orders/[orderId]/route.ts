import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapInventoryMovementRow,
  mapPurchaseOrderItemRow,
  mapPurchaseOrderRow,
  mapSupplierRow,
  normalizeNullable,
  requireSuppliersRequest,
} from "@/app/api/_lib/suppliers";
import {
  updatePurchaseOrderSchema,
  type UpdatePurchaseOrderInput,
} from "@/features/suppliers/schemas";
import { computePurchaseOrderLineTotals, computePurchaseOrderTotals } from "@/features/suppliers/purchase-order.utils";
import type {
  PurchaseOrderDetailResponse,
  PurchaseOrderMutationResponse,
} from "@/features/suppliers/suppliers.types";

async function loadOrderDetail(
  adminClient: ReturnType<typeof createAdminClient>,
  orderId: string,
  includeMovements: boolean,
) {
  const { data: order, error: orderError } = await adminClient
    .from("purchase_orders")
    .select("id, supplier_id, order_number, status, ordered_at, expected_at, subtotal_cents, discount_cents, tax_cents, total_cents, notes, created_at, updated_at")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    return null;
  }

  const [{ data: supplier, error: supplierError }, { data: items, error: itemsError }, { data: movements, error: movementsError }] = await Promise.all([
    adminClient
      .from("suppliers")
      .select("id, name, email, phone, tax_id, payment_terms_days, is_active, address, created_at, updated_at")
      .eq("id", order.supplier_id)
      .maybeSingle(),
    adminClient
      .from("purchase_order_items")
      .select("id, product_id, variant_id, ordered_qty, received_qty, unit_cost_cents, tax_rate, line_total_cents")
      .eq("purchase_order_id", orderId)
      .order("id", { ascending: true }),
    includeMovements
      ? adminClient
          .from("inventory_movements")
          .select("id, movement_type, quantity, unit_cost_cents, reference_type, reference_id, notes, moved_at, moved_by, location_id, product_id, variant_id")
          .eq("reference_type", "purchase_order")
          .eq("reference_id", orderId)
          .order("moved_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (supplierError || itemsError || movementsError) {
    throw new Error(supplierError?.message ?? itemsError?.message ?? movementsError?.message ?? "No se pudo cargar la orden de compra.");
  }

  if (!supplier) {
    throw new Error("El proveedor asociado a la orden de compra no existe.");
  }

  const productIds = Array.from(new Set((items ?? []).map((item) => item.product_id).concat((movements ?? []).map((movement) => movement.product_id))));
  const variantIds = Array.from(new Set((items ?? []).flatMap((item) => item.variant_id ? [item.variant_id] : []).concat((movements ?? []).flatMap((movement) => movement.variant_id ? [movement.variant_id] : []))));
  const locationIds = includeMovements ? Array.from(new Set((movements ?? []).map((movement) => movement.location_id))) : [];
  const profileIds = includeMovements ? Array.from(new Set((movements ?? []).flatMap((movement) => movement.moved_by ? [movement.moved_by] : []))) : [];

  const [{ data: products }, { data: variants }, { data: locations }, { data: profiles }, { data: supplierLinks }] = await Promise.all([
    productIds.length > 0 ? adminClient.from("products").select("id, name").in("id", productIds) : Promise.resolve({ data: [], error: null }),
    variantIds.length > 0 ? adminClient.from("product_variants").select("id, product_id, name, sku").in("id", variantIds) : Promise.resolve({ data: [], error: null }),
    locationIds.length > 0 ? adminClient.from("inventory_locations").select("id, code, name").in("id", locationIds) : Promise.resolve({ data: [], error: null }),
    profileIds.length > 0 ? adminClient.from("profiles").select("id, full_name, email").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
    productIds.length > 0
      ? adminClient.from("product_suppliers").select("id, product_id, variant_id, supplier_sku").eq("supplier_id", order.supplier_id).in("product_id", productIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const variantsById = new Map((variants ?? []).map((variant) => [variant.id, variant]));
  const locationsById = new Map((locations ?? []).map((location) => [location.id, location]));
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const supplierLinkByKey = new Map((supplierLinks ?? []).map((link) => [`${link.product_id}:${link.variant_id ?? "product"}`, link]));

  return {
    order,
    supplier,
    items: (items ?? []).map((item) => {
      const product = productsById.get(item.product_id);
      const variant = item.variant_id ? variantsById.get(item.variant_id) : null;
      const supplierLink = supplierLinkByKey.get(`${item.product_id}:${item.variant_id ?? "product"}`);

      return mapPurchaseOrderItemRow(item, {
        productName: product?.name ?? "Producto desconocido",
        variantName: variant?.name ?? null,
        sku: variant?.sku ?? "SIN-SKU",
        supplierSku: supplierLink?.supplier_sku ?? null,
      });
    }),
    movements: includeMovements ? (movements ?? []).map((movement) => {
      const location = locationsById.get(movement.location_id);
      const product = productsById.get(movement.product_id);
      const variant = movement.variant_id ? variantsById.get(movement.variant_id) : null;
      const profile = movement.moved_by ? profilesById.get(movement.moved_by) : null;

      return mapInventoryMovementRow(movement, {
        movedByName: profile?.full_name ?? null,
        movedByEmail: profile?.email ?? null,
        locationCode: location?.code ?? "SIN",
        locationName: location?.name ?? "Ubicacion desconocida",
        productName: product?.name ?? "Producto desconocido",
        variantName: variant?.name ?? null,
        variantSku: variant?.sku ?? "SIN-SKU",
      });
    }) : [],
  };
}

async function validateOrderIsEditable(adminClient: ReturnType<typeof createAdminClient>, orderId: string) {
  const { data, error } = await adminClient
    .from("purchase_orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  if (!["draft", "sent"].includes(data.status)) {
    throw new Error("Solo puedes editar ordenes en estado borrador o enviada.");
  }

  return data;
}

async function validatePurchaseOrderItems(
  adminClient: ReturnType<typeof createAdminClient>,
  items: UpdatePurchaseOrderInput["items"],
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
          .select("id, product_id, name, is_active")
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
  items: UpdatePurchaseOrderInput["items"],
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

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const { orderId } = await context.params;
  const adminClient = createAdminClient();
  const url = new URL(request.url);
  const includeMovements = url.searchParams.get("includeMovements") !== "false";

  try {
    const detail = await loadOrderDetail(adminClient, orderId, includeMovements);

    if (!detail) {
      return NextResponse.json({ message: "Orden de compra no encontrada." }, { status: 404 });
    }

    const responseBody: PurchaseOrderDetailResponse = {
      order: {
        id: detail.order.id,
        supplier: mapSupplierRow(detail.supplier),
        orderNumber: detail.order.order_number,
        status: detail.order.status,
        orderedAt: detail.order.ordered_at,
        expectedAt: detail.order.expected_at,
        subtotalCents: detail.order.subtotal_cents,
        discountCents: detail.order.discount_cents,
        taxCents: detail.order.tax_cents,
        totalCents: detail.order.total_cents,
        notes: detail.order.notes,
        createdAt: detail.order.created_at,
        updatedAt: detail.order.updated_at,
        items: detail.items,
        movements: detail.movements,
      },
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo cargar la orden de compra." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const { orderId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsedPayload = updatePurchaseOrderSchema.safeParse({ ...(payload ?? {}), id: orderId });

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: "Datos invalidos.", errors: parsedPayload.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();

  try {
    const editableOrder = await validateOrderIsEditable(adminClient, orderId);

    if (!editableOrder) {
      return NextResponse.json({ message: "Orden de compra no encontrada." }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo validar la orden de compra." },
      { status: 400 },
    );
  }

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
  const { data: updatedOrder, error: updateError } = await adminClient
    .from("purchase_orders")
    .update({
      supplier_id: input.supplierId,
      status: input.status,
      ordered_at: input.orderedAt,
      expected_at: input.expectedAt || null,
      subtotal_cents: totals.subtotalCents,
      discount_cents: totals.discountCents,
      tax_cents: totals.taxCents,
      total_cents: totals.totalCents,
      notes: normalizeNullable(input.notes),
    })
    .eq("id", orderId)
    .select("id, supplier_id, order_number, status, ordered_at, expected_at, subtotal_cents, discount_cents, tax_cents, total_cents, notes, created_at, updated_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      { message: updateError.message ?? "No se pudo actualizar la orden de compra." },
      { status: 400 },
    );
  }

  if (!updatedOrder) {
    return NextResponse.json({ message: "Orden de compra no encontrada." }, { status: 404 });
  }

  const { error: deleteItemsError } = await adminClient.from("purchase_order_items").delete().eq("purchase_order_id", orderId);

  if (deleteItemsError) {
    return NextResponse.json(
      { message: deleteItemsError.message ?? "No se pudieron reemplazar las lineas de compra." },
      { status: 400 },
    );
  }

  const { error: insertItemsError } = await adminClient.from("purchase_order_items").insert(
    input.items.map((item) => {
      const line = computePurchaseOrderLineTotals(item);

      return {
        purchase_order_id: orderId,
        product_id: item.productId,
        variant_id: item.variantId,
        ordered_qty: item.orderedQty,
        unit_cost_cents: item.unitCostCents,
        tax_rate: item.taxRate,
        line_total_cents: line.totalCents,
      };
    }),
  );

  if (insertItemsError) {
    return NextResponse.json(
      { message: insertItemsError.message ?? "No se pudieron guardar las nuevas lineas de compra." },
      { status: 400 },
    );
  }

  try {
    await upsertProductSupplierLinks(adminClient, input.supplierId, input.items);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo actualizar la relacion proveedor-producto." },
      { status: 400 },
    );
  }

  const { data: supplier } = await adminClient
    .from("suppliers")
    .select("name")
    .eq("id", input.supplierId)
    .maybeSingle();

  const responseBody: PurchaseOrderMutationResponse = {
    message: "Orden de compra actualizada correctamente.",
    order: mapPurchaseOrderRow({ ...updatedOrder, supplier_name: supplier?.name ?? null }, input.items.length),
  };

  return NextResponse.json(responseBody);
}
