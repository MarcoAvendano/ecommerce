import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapInventoryMovementRow,
  mapPurchaseOrderRow,
  mapSupplierContactRow,
  mapSupplierRow,
  requireSuppliersRequest,
} from "@/app/api/_lib/suppliers";
import type { SupplierDetailResponse } from "@/features/suppliers/suppliers.types";
import type { InventoryMovementHistoryItem } from "@/features/suppliers/suppliers.types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ supplierId: string }> },
) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const { supplierId } = await context.params;
  const adminClient = createAdminClient();

  const [{ data: supplier, error: supplierError }, { data: contacts, error: contactsError }, { data: orders, error: ordersError }] = await Promise.all([
    adminClient
      .from("suppliers")
      .select("id, name, email, phone, tax_id, payment_terms_days, is_active, address, created_at, updated_at")
      .eq("id", supplierId)
      .maybeSingle(),
    adminClient
      .from("supplier_contacts")
      .select("id, supplier_id, full_name, email, phone, role, created_at, updated_at")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: true }),
    adminClient
      .from("purchase_orders")
      .select("id, supplier_id, order_number, status, ordered_at, expected_at, subtotal_cents, discount_cents, tax_cents, total_cents, notes, created_at, updated_at")
      .eq("supplier_id", supplierId)
      .order("ordered_at", { ascending: false }),
  ]);

  if (supplierError || contactsError || ordersError) {
    return NextResponse.json(
      { message: supplierError?.message ?? contactsError?.message ?? ordersError?.message ?? "No se pudo cargar el proveedor." },
      { status: 500 },
    );
  }

  if (!supplier) {
    return NextResponse.json({ message: "Proveedor no encontrado." }, { status: 404 });
  }

  const orderIds = (orders ?? []).map((order) => order.id);
  const itemCountsByOrderId = new Map<string, number>();
  let recentMovements: InventoryMovementHistoryItem[] = [];

  if (orderIds.length > 0) {
    const [{ data: orderItems, error: orderItemsError }, { data: movements, error: movementsError }] = await Promise.all([
      adminClient
        .from("purchase_order_items")
        .select("id, purchase_order_id")
        .in("purchase_order_id", orderIds),
      adminClient
        .from("inventory_movements")
        .select("id, movement_type, quantity, unit_cost_cents, reference_type, reference_id, notes, moved_at, moved_by, location_id, product_id, variant_id")
        .eq("reference_type", "purchase_order")
        .in("reference_id", orderIds)
        .order("moved_at", { ascending: false })
        .limit(30),
    ]);

    if (orderItemsError || movementsError) {
      return NextResponse.json(
        { message: orderItemsError?.message ?? movementsError?.message ?? "No se pudo cargar la actividad del proveedor." },
        { status: 500 },
      );
    }

    for (const orderItem of orderItems ?? []) {
      itemCountsByOrderId.set(
        orderItem.purchase_order_id,
        (itemCountsByOrderId.get(orderItem.purchase_order_id) ?? 0) + 1,
      );
    }

    const locationIds = Array.from(new Set((movements ?? []).map((movement) => movement.location_id)));
    const productIds = Array.from(new Set((movements ?? []).map((movement) => movement.product_id)));
    const variantIds = Array.from(new Set((movements ?? []).flatMap((movement) => movement.variant_id ? [movement.variant_id] : [])));
    const profileIds = Array.from(new Set((movements ?? []).flatMap((movement) => movement.moved_by ? [movement.moved_by] : [])));

    const [{ data: locations }, { data: products }, { data: variants }, { data: profiles }] = await Promise.all([
      locationIds.length > 0
        ? adminClient.from("inventory_locations").select("id, code, name").in("id", locationIds)
        : Promise.resolve({ data: [], error: null }),
      productIds.length > 0
        ? adminClient.from("products").select("id, name").in("id", productIds)
        : Promise.resolve({ data: [], error: null }),
      variantIds.length > 0
        ? adminClient.from("product_variants").select("id, name, sku").in("id", variantIds)
        : Promise.resolve({ data: [], error: null }),
      profileIds.length > 0
        ? adminClient.from("profiles").select("id, full_name, email").in("id", profileIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const locationsById = new Map((locations ?? []).map((location) => [location.id, location]));
    const productsById = new Map((products ?? []).map((product) => [product.id, product]));
    const variantsById = new Map((variants ?? []).map((variant) => [variant.id, variant]));
    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    recentMovements = (movements ?? []).map((movement) => {
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
    });
  }

  const responseBody: SupplierDetailResponse = {
    supplier: {
      ...mapSupplierRow(supplier),
      contacts: (contacts ?? []).map(mapSupplierContactRow),
      purchaseOrders: (orders ?? []).map((order) => mapPurchaseOrderRow({ ...order, supplier_name: supplier.name }, itemCountsByOrderId.get(order.id) ?? 0)),
      recentMovements,
    },
  };

  return NextResponse.json(responseBody);
}
