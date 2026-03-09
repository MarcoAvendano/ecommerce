import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOptionGroupById,
  loadProductOptionGroups,
  removeOptionGroupSelectionsFromVariants,
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ productId: string; groupId: string }> },
) {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const { productId, groupId } = await context.params;
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

  const cleanupError = await removeOptionGroupSelectionsFromVariants(adminClient, productId, groupId);

  if (cleanupError) {
    return NextResponse.json(
      { message: cleanupError.message ?? "No se pudieron limpiar las relaciones de variantes." },
      { status: 500 },
    );
  }

  const { error: deleteSelectionsError } = await adminClient
    .from("product_variant_option_values")
    .delete()
    .eq("option_group_id", groupId);

  if (deleteSelectionsError) {
    return NextResponse.json(
      { message: deleteSelectionsError.message ?? "No se pudieron eliminar las relaciones del grupo." },
      { status: 500 },
    );
  }

  const { error: deleteGroupError } = await adminClient
    .from("product_option_groups")
    .delete()
    .eq("id", groupId)
    .eq("product_id", productId);

  if (deleteGroupError) {
    return NextResponse.json(
      { message: deleteGroupError.message ?? "No se pudo eliminar el grupo de opciones." },
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
    message: "Grupo de opciones eliminado correctamente.",
    optionGroups: result.optionGroups,
  });
}
