import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getNextOptionGroupSortOrder,
  hasOptionGroupNameConflict,
  loadProductOptionGroups,
} from "@/features/catalog/product-option-groups.server";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const { productId } = await context.params;
  const adminClient = createAdminClient();
  const result = await loadProductOptionGroups(adminClient, productId);

  if (result.error) {
    return NextResponse.json(
      { message: result.error.message ?? "No se pudieron cargar los grupos de opciones." },
      { status: 500 },
    );
  }

  return NextResponse.json({ optionGroups: result.optionGroups });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const { productId } = await context.params;
  const payload = (await request.json()) as {
    name?: string;
    values?: Array<{ value?: string }>;
  };

  const name = payload.name?.trim() ?? "";
  const nextValues = (payload.values ?? [])
    .map((item) => item.value?.trim() ?? "")
    .filter(Boolean);

  if (!name) {
    return NextResponse.json({ message: "Ingresa el nombre del grupo de opciones." }, { status: 400 });
  }

  if (nextValues.length === 0) {
    return NextResponse.json({ message: "Agrega al menos una opcion para el grupo." }, { status: 400 });
  }

  const normalizedValues = Array.from(new Set(nextValues.map((value) => value.toLocaleLowerCase())));

  if (normalizedValues.length !== nextValues.length) {
    return NextResponse.json({ message: "No repitas opciones dentro del mismo grupo." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const nameConflict = await hasOptionGroupNameConflict(adminClient, productId, name);

  if (nameConflict.error) {
    return NextResponse.json(
      { message: nameConflict.error.message ?? "No se pudieron validar los grupos de opciones." },
      { status: 500 },
    );
  }

  if (nameConflict.conflict) {
    return NextResponse.json({ message: "Ya existe un grupo con ese nombre." }, { status: 409 });
  }

  const sortOrderResult = await getNextOptionGroupSortOrder(adminClient, productId);

  if (sortOrderResult.error) {
    return NextResponse.json(
      { message: sortOrderResult.error.message ?? "No se pudo calcular el orden del grupo." },
      { status: 500 },
    );
  }

  const { data: insertedGroup, error: insertGroupError } = await adminClient
    .from("product_option_groups")
    .insert({
      product_id: productId,
      name,
      sort_order: sortOrderResult.sortOrder,
    })
    .select("id")
    .single();

  if (insertGroupError || !insertedGroup) {
    return NextResponse.json(
      { message: insertGroupError?.message ?? "No se pudo crear el grupo de opciones." },
      { status: 500 },
    );
  }

  const valuesPayload = nextValues.map((value, index) => ({
    option_group_id: insertedGroup.id,
    value,
    sort_order: index,
  }));

  const { error: insertValuesError } = await adminClient
    .from("product_option_group_values")
    .insert(valuesPayload);

  if (insertValuesError) {
    return NextResponse.json(
      { message: insertValuesError.message ?? "No se pudieron crear las opciones del grupo." },
      { status: 500 },
    );
  }

  const result = await loadProductOptionGroups(adminClient, productId);

  if (result.error) {
    return NextResponse.json(
      { message: result.error.message ?? "No se pudieron cargar los grupos actualizados." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Grupo de opciones creado correctamente.",
    optionGroups: result.optionGroups,
  });
}
