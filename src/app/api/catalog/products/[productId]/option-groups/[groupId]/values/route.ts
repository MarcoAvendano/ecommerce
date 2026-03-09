import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getNextOptionGroupValueSortOrder,
  getOptionGroupById,
  hasOptionGroupValueConflict,
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

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string; groupId: string }> },
) {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const { productId, groupId } = await context.params;
  const payload = (await request.json()) as { value?: string };
  const value = payload.value?.trim() ?? "";

  if (!value) {
    return NextResponse.json({ message: "Ingresa el valor de la opcion." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const groupResult = await getOptionGroupById(adminClient, productId, groupId);

  if (groupResult.error) {
    return NextResponse.json(
      { message: groupResult.error.message ?? "No se pudo validar el grupo de opciones." },
      { status: 500 },
    );
  }

  if (!groupResult.optionGroup) {
    return NextResponse.json({ message: "El grupo de opciones no existe." }, { status: 404 });
  }

  // const conflictResult = await hasOptionGroupValueConflict(adminClient, groupId, value);

  // if (conflictResult.error) {
  //   return NextResponse.json(
  //     { message: conflictResult.error.message ?? "No se pudo validar la opcion." },
  //     { status: 500 },
  //   );
  // }

  // if (conflictResult.conflict) {
  //   return NextResponse.json({ message: "Ese valor ya existe en el grupo." }, { status: 409 });
  // }

  const sortOrderResult = await getNextOptionGroupValueSortOrder(adminClient, groupId);

  if (sortOrderResult.error) {
    return NextResponse.json(
      { message: sortOrderResult.error.message ?? "No se pudo calcular el orden de la opcion." },
      { status: 500 },
    );
  }

  const { error: insertError } = await adminClient
    .from("product_option_group_values")
    .insert({
      option_group_id: groupId,
      value,
      sort_order: sortOrderResult.sortOrder,
    });

  if (insertError) {
    return NextResponse.json(
      { message: insertError.message ?? "No se pudo agregar la opcion." },
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
    message: "Opcion agregada correctamente.",
    optionGroups: result.optionGroups,
  });
}
