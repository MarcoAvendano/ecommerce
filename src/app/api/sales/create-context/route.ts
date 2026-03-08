import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SalesCreateContextResponse } from "@/features/sales/sales.types";

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

export async function GET() {
  const salesRequest = await requireSalesRequest();

  if (salesRequest.error) {
    return salesRequest.error;
  }

  const adminClient = createAdminClient();
  const [
    { data: locations, error: locationsError },
    { data: customers, error: customersError },
    { data: products, error: productsError },
    { data: variants, error: variantsError },
    { data: balances, error: balancesError },
  ] = await Promise.all([
    adminClient
      .from("inventory_locations")
      .select("id, code, name, location_type")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    adminClient
      .from("customers")
      .select("id, full_name, email, phone")
      .order("full_name", { ascending: true }),
    adminClient
      .from("products")
      .select("id, name, slug, status, track_inventory, is_sellable")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    adminClient
      .from("product_variants")
      .select("id, product_id, name, sku, barcode, price_cents, is_default, is_active")
      .order("is_default", { ascending: false })
      .order("name", { ascending: true }),
    adminClient
      .from("inventory_balances")
      .select("location_id, variant_id, available_qty")
      .not("variant_id", "is", null),
  ]);

  if (locationsError || customersError || productsError || variantsError || balancesError) {
    return NextResponse.json(
      {
        message:
          locationsError?.message ??
          customersError?.message ??
          productsError?.message ??
          variantsError?.message ??
          balancesError?.message ??
          "No se pudo cargar el contexto de ventas.",
      },
      { status: 500 },
    );
  }

  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const availableQtyByVariantId = new Map<string, Record<string, number>>();

  for (const balance of balances ?? []) {
    if (!balance.variant_id) {
      continue;
    }

    const currentAvailability = availableQtyByVariantId.get(balance.variant_id) ?? {};
    currentAvailability[balance.location_id] = balance.available_qty ?? 0;
    availableQtyByVariantId.set(balance.variant_id, currentAvailability);
  }

  const responseBody: SalesCreateContextResponse = {
    locations: (locations ?? []).map((location) => ({
      id: location.id,
      code: location.code,
      name: location.name,
      locationType: location.location_type,
    })),
    customers: (customers ?? []).map((customer) => ({
      id: customer.id,
      fullName: customer.full_name,
      email: customer.email,
      phone: customer.phone,
    })),
    variants: (variants ?? [])
      .flatMap((variant) => {
        const product = productsById.get(variant.product_id);

        if (!product) {
          return [];
        }

        return [
          {
            id: variant.id,
            productId: variant.product_id,
            productName: product.name,
            productSlug: product.slug,
            productStatus: product.status,
            trackInventory: product.track_inventory,
            isSellable: product.is_sellable,
            variantName: variant.name,
            sku: variant.sku,
            barcode: variant.barcode,
            priceCents: variant.price_cents,
            isDefault: variant.is_default,
            isActive: variant.is_active,
            availableQtyByLocation: availableQtyByVariantId.get(variant.id) ?? {},
          },
        ];
      })
      .filter((variant) => variant.isActive && variant.isSellable && variant.productStatus === "active"),
  };

  return NextResponse.json(responseBody);
}
