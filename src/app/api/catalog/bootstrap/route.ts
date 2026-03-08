import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductEditorBootstrapResponse } from "@/features/catalog/catalog.types";

async function requireCatalogRequest() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return {
      error: NextResponse.json({ message: "No autenticado." }, { status: 401 }),
    };
  }

  const isAllowed = authContext.isAdmin || (await hasAnyRole(["manager"]));

  if (!isAllowed) {
    return {
      error: NextResponse.json({ message: "No autorizado." }, { status: 403 }),
    };
  }

  return { authContext };
}

export async function GET() {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const adminClient = createAdminClient();
  const [
    { data: categories, error: categoriesError },
    { data: stores, error: storesError },
  ] = await Promise.all([
    adminClient.from("categories").select("id, name, slug").eq("is_active", true).order("name", { ascending: true }),
    adminClient
      .from("inventory_locations")
      .select("id, code, name, location_type")
      .eq("is_active", true)
      .eq("location_type", "store")
      .order("name", { ascending: true }),
  ]);

  if (categoriesError || storesError) {
    return NextResponse.json(
      {
        message:
          categoriesError?.message ?? storesError?.message ?? "No se pudo cargar el formulario de producto.",
      },
      { status: 500 },
    );
  }

  const responseBody: ProductEditorBootstrapResponse = {
    categories: (categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    stores: (stores ?? []).map((store) => ({
      id: store.id,
      code: store.code,
      name: store.name,
      locationType: store.location_type,
    })),
  };

  return NextResponse.json(responseBody);
}
