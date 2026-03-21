import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuppliersRequest } from "@/app/api/_lib/suppliers";
import type { PurchaseCreateContextResponse } from "@/features/suppliers/suppliers.types";

export async function GET(request: Request) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const adminClient = createAdminClient();
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "receipt" ? "receipt" : "create";
  const shouldLoadVariants = mode === "create";
  const [{ data: locations, error: locationsError }, { data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
    adminClient
      .from("inventory_locations")
      .select("id, code, name, location_type")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    shouldLoadVariants
      ? adminClient
          .from("products")
          .select("id, name, is_purchasable, status")
          .eq("is_purchasable", true)
          .eq("status", "active")
          .is("deleted_at", null)
          .order("name", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    shouldLoadVariants
      ? adminClient
          .from("product_variants")
          .select("id, product_id, name, sku, cost_cents, is_active")
          .eq("is_active", true)
          .order("name", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (locationsError || productsError || variantsError) {
    return NextResponse.json(
      { message: locationsError?.message ?? productsError?.message ?? variantsError?.message ?? "No se pudo cargar el contexto de compras." },
      { status: 500 },
    );
  }

  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const responseBody: PurchaseCreateContextResponse = {
    locations: (locations ?? []).map((location) => ({
      id: location.id,
      code: location.code,
      name: location.name,
      locationType: location.location_type,
    })),
    variants: shouldLoadVariants
      ? (variants ?? [])
          .filter((variant) => productsById.has(variant.product_id))
          .map((variant) => ({
            productId: variant.product_id,
            variantId: variant.id,
            productName: productsById.get(variant.product_id)?.name ?? "Producto",
            variantName: variant.name,
            sku: variant.sku,
            defaultCostCents: variant.cost_cents,
            isActive: variant.is_active,
          }))
      : [],
  };

  return NextResponse.json(responseBody);
}
