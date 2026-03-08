import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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

async function syncProductOptionGroups(
  adminClient: ReturnType<typeof createAdminClient>,
  productId: string,
  optionGroups: Array<{
    id?: string;
    name: string;
    sortOrder: number;
    values: Array<{
      id?: string;
      value: string;
      sortOrder: number;
    }>;
  }>,
) {
  const { data: existingGroups, error: existingGroupsError } = await adminClient
    .from("product_option_groups")
    .select("id")
    .eq("product_id", productId);

  if (existingGroupsError) {
    return { error: existingGroupsError, optionGroups: [] };
  }

  const existingGroupIds = (existingGroups ?? []).map((group) => group.id);

  if (existingGroupIds.length > 0) {
    const { error: deleteSelectionsError } = await adminClient
      .from("product_variant_option_values")
      .delete()
      .in("option_group_id", existingGroupIds);

    if (deleteSelectionsError) {
      return { error: deleteSelectionsError, optionGroups: [] };
    }

    const { error: deleteValuesError } = await adminClient
      .from("product_option_group_values")
      .delete()
      .in("option_group_id", existingGroupIds);

    if (deleteValuesError) {
      return { error: deleteValuesError, optionGroups: [] };
    }
  }

  const { error: deleteGroupsError } = await adminClient
    .from("product_option_groups")
    .delete()
    .eq("product_id", productId);

  if (deleteGroupsError) {
    return { error: deleteGroupsError, optionGroups: [] };
  }

  if (optionGroups.length === 0) {
    return { error: null, optionGroups: [] };
  }

  const { data: insertedGroups, error: insertGroupsError } = await adminClient
    .from("product_option_groups")
    .insert(
      optionGroups.map((group) => ({
        product_id: productId,
        name: group.name,
        sort_order: group.sortOrder,
      })),
    )
    .select("id, product_id, name, sort_order");

  if (insertGroupsError) {
    return { error: insertGroupsError, optionGroups: [] };
  }

  const groupIdByName = new Map((insertedGroups ?? []).map((group) => [group.name, group.id]));
  const valuesPayload = optionGroups.flatMap((group) => {
    const optionGroupId = groupIdByName.get(group.name);

    if (!optionGroupId) {
      return [];
    }

    return group.values.map((value) => ({
      option_group_id: optionGroupId,
      value: value.value,
      sort_order: value.sortOrder,
    }));
  });

  const insertedValues = valuesPayload.length > 0
    ? await adminClient
        .from("product_option_group_values")
        .insert(valuesPayload)
        .select("id, option_group_id, value, sort_order")
    : { data: [], error: null };

  if (insertedValues.error) {
    return { error: insertedValues.error, optionGroups: [] };
  }

  const valuesByGroupId = new Map<string, Array<{ id: string; optionGroupId: string; value: string; sortOrder: number }>>();

  for (const value of insertedValues.data ?? []) {
    const currentValues = valuesByGroupId.get(value.option_group_id) ?? [];
    currentValues.push({
      id: value.id,
      optionGroupId: value.option_group_id,
      value: value.value,
      sortOrder: value.sort_order,
    });
    valuesByGroupId.set(value.option_group_id, currentValues);
  }

  return {
    error: null,
    optionGroups: (insertedGroups ?? []).map((group) => ({
      id: group.id,
      productId: group.product_id,
      name: group.name,
      sortOrder: group.sort_order,
      values: valuesByGroupId.get(group.id) ?? [],
    })),
  };
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const { productId } = await context.params;
  const payload = (await request.json()) as {
    optionGroups: Array<{
      id?: string;
      name: string;
      sortOrder: number;
      values: Array<{ id?: string; value: string; sortOrder: number }>;
    }>;
  };

  const adminClient = createAdminClient();
  const result = await syncProductOptionGroups(adminClient, productId, payload.optionGroups ?? []);

  if (result.error) {
    return NextResponse.json(
      { message: result.error.message ?? "No se pudieron guardar los grupos de opciones." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Grupos de opciones actualizados correctamente.",
    optionGroups: result.optionGroups,
  });
}
