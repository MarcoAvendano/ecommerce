import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "../../../../../../../types/supabase";

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
    return { error: existingGroupsError };
  }

  const existingGroupIds = (existingGroups ?? []).map((group) => group.id);

  if (existingGroupIds.length > 0) {
    const { error: deleteSelectionsError } = await adminClient
      .from("product_variant_option_values")
      .delete()
      .in("option_group_id", existingGroupIds);

    if (deleteSelectionsError) {
      return { error: deleteSelectionsError };
    }

    const { error: deleteValuesError } = await adminClient
      .from("product_option_group_values")
      .delete()
      .in("option_group_id", existingGroupIds);

    if (deleteValuesError) {
      return { error: deleteValuesError };
    }
  }

  const { error: deleteGroupsError } = await adminClient
    .from("product_option_groups")
    .delete()
    .eq("product_id", productId);

  if (deleteGroupsError) {
    return { error: deleteGroupsError };
  }

  if (optionGroups.length === 0) {
    return {
      error: null,
      groupIdByName: new Map<string, string>(),
      valueIdByGroupAndValue: new Map<string, string>(),
    };
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
    .select("id, name");

  if (insertGroupsError) {
    return { error: insertGroupsError };
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
        .select("id, option_group_id, value")
    : { data: [], error: null };

  if (insertedValues.error) {
    return { error: insertedValues.error };
  }

  const valueIdByGroupAndValue = new Map(
    (insertedValues.data ?? []).map((value) => [`${value.option_group_id}:${value.value}`, value.id]),
  );

  return {
    error: null,
    groupIdByName,
    valueIdByGroupAndValue,
  };
}

async function syncProductVariants(
  adminClient: ReturnType<typeof createAdminClient>,
  productId: string,
  variants: Array<{
    id?: string;
    name: string;
    sku: string;
    barcode?: string;
    priceCents: number;
    compareAtPriceCents: number | null;
    costCents: number;
    initialStockQty: number;
    isActive: boolean;
    optionSelections: Array<{
      groupId: string;
      groupName: string;
      valueId: string;
      value: string;
    }>;
  }>,
  selectionMaps: {
    groupIdByName: Map<string, string>;
    valueIdByGroupAndValue: Map<string, string>;
  },
) {
  const { data: existingVariants, error: existingVariantsError } = await adminClient
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  if (existingVariantsError) {
    return existingVariantsError;
  }

  const existingVariantIds = new Set((existingVariants ?? []).map((variant) => variant.id));
  const invalidStockEdit = variants.find((variant) =>
    variant.id && existingVariantIds.has(variant.id) && variant.initialStockQty > 0,
  );

  if (invalidStockEdit) {
    return new Error("No puedes modificar el stock inicial de una variante ya creada.");
  }

  const payload = variants.map((variant, index) => {
    const nextOptionValues = variant.optionSelections.flatMap((selection) => {
      const optionGroupId = selectionMaps.groupIdByName.get(selection.groupName) ?? selection.groupId;
      const optionValueId = selectionMaps.valueIdByGroupAndValue.get(`${optionGroupId}:${selection.value}`) ?? selection.valueId;

      if (!optionGroupId || !optionValueId) {
        return [];
      }

      return [{
        groupId: optionGroupId,
        groupName: selection.groupName,
        valueId: optionValueId,
        value: selection.value,
      }];
    });

    const basePayload = {
      product_id: productId,
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode?.trim() || null,
      price_cents: variant.priceCents,
      compare_at_price_cents: variant.compareAtPriceCents,
      cost_cents: variant.costCents,
      is_default: index === 0,
      is_active: variant.isActive,
      option_values: nextOptionValues as Json,
    };

    return variant.id
      ? {
          id: variant.id,
          ...basePayload,
        }
      : basePayload;
  });

  const updatePayload = payload.filter((variant) => "id" in variant);
  const insertPayload = payload.filter((variant) => !("id" in variant));

  if (updatePayload.length > 0) {
    const { error: upsertError } = await adminClient.from("product_variants").upsert(updatePayload);

    if (upsertError) {
      return upsertError;
    }
  }

  if (insertPayload.length > 0) {
    const { error: insertError } = await adminClient.from("product_variants").insert(insertPayload);

    if (insertError) {
      return insertError;
    }
  }

  const keepVariantIds = variants.flatMap((variant) => (variant.id ? [variant.id] : []));
  const removableVariantIds = (existingVariants ?? [])
    .map((variant) => variant.id)
    .filter((variantId) => !keepVariantIds.includes(variantId));

  if (removableVariantIds.length > 0) {
    const { error: deleteError } = await adminClient
      .from("product_variants")
      .delete()
      .eq("product_id", productId)
      .in("id", removableVariantIds);

    if (deleteError) {
      return deleteError;
    }
  }

  const { data: savedVariants, error: savedVariantsError } = await adminClient
    .from("product_variants")
    .select("id, sku")
    .eq("product_id", productId);

  if (savedVariantsError) {
    return savedVariantsError;
  }

  const variantIdBySku = new Map((savedVariants ?? []).map((variant) => [variant.sku, variant.id]));
  const variantIds = (savedVariants ?? []).map((variant) => variant.id);

  if (variantIds.length > 0) {
    const { error: deleteSelectionsError } = await adminClient
      .from("product_variant_option_values")
      .delete()
      .in("product_variant_id", variantIds);

    if (deleteSelectionsError) {
      return deleteSelectionsError;
    }
  }

  const selectionRows = variants.flatMap((variant) => {
    const productVariantId = variant.id ?? variantIdBySku.get(variant.sku);

    if (!productVariantId) {
      return [];
    }

    return variant.optionSelections.flatMap((selection) => {
      const optionGroupId = selectionMaps.groupIdByName.get(selection.groupName) ?? selection.groupId;
      const optionGroupValueId = selectionMaps.valueIdByGroupAndValue.get(`${optionGroupId}:${selection.value}`) ?? selection.valueId;

      if (!optionGroupId || !optionGroupValueId) {
        return [];
      }

      return [{
        product_variant_id: productVariantId,
        option_group_id: optionGroupId,
        option_group_value_id: optionGroupValueId,
      }];
    });
  });

  if (selectionRows.length > 0) {
    const { error: insertSelectionsError } = await adminClient
      .from("product_variant_option_values")
      .insert(selectionRows);

    if (insertSelectionsError) {
      return insertSelectionsError;
    }
  }

  return null;
}

function extractStoreIdFromMetadata(metadata: Json | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  return typeof metadata.storeId === "string" ? metadata.storeId : null;
}

async function createVariantInventoryLoad(
  adminClient: ReturnType<typeof createAdminClient>,
  productId: string,
  variants: Array<{
    sku: string;
    initialStockQty: number;
    costCents: number;
  }>,
) {
  const variantsWithStock = variants.filter((variant) => variant.initialStockQty > 0);

  if (variantsWithStock.length === 0) {
    return null;
  }

  const { data: product, error: productError } = await adminClient
    .from("products")
    .select("id, metadata")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle();

  if (productError) {
    return productError;
  }

  const locationId = extractStoreIdFromMetadata(product?.metadata);

  if (!locationId) {
    return null;
  }

  const { data: savedVariants, error: variantsError } = await adminClient
    .from("product_variants")
    .select("id, sku")
    .eq("product_id", productId);

  if (variantsError) {
    return variantsError;
  }

  const variantIdBySku = new Map((savedVariants ?? []).map((variant) => [variant.sku, variant.id]));
  const movementPayload = variantsWithStock.flatMap((variant) => {
    const variantId = variantIdBySku.get(variant.sku);

    if (!variantId) {
      return [];
    }

    return [{
      location_id: locationId,
      product_id: productId,
      variant_id: variantId,
      movement_type: "initial_load",
      quantity: variant.initialStockQty,
      unit_cost_cents: variant.costCents,
      reference_type: "product",
      reference_id: productId,
      notes: "Carga inicial desde gestion de variantes.",
    }];
  });

  if (movementPayload.length === 0) {
    return null;
  }

  const { error: movementError } = await adminClient
    .from("inventory_movements")
    .insert(movementPayload);

  return movementError;
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
    variants: Array<{
      id?: string;
      name: string;
      sku: string;
      barcode?: string;
      priceCents: number;
      compareAtPriceCents: number | null;
      costCents: number;
      initialStockQty: number;
      isActive: boolean;
      optionSelections: Array<{
        groupId: string;
        groupName: string;
        valueId: string;
        value: string;
      }>;
    }>;
  };

  const adminClient = createAdminClient();
  const optionGroupsResult = await syncProductOptionGroups(adminClient, productId, payload.optionGroups ?? []);

  if (optionGroupsResult.error) {
    return NextResponse.json(
      { message: optionGroupsResult.error.message ?? "No se pudieron guardar los grupos de opciones." },
      { status: 500 },
    );
  }

  const variantsError = await syncProductVariants(adminClient, productId, payload.variants ?? [], {
    groupIdByName: optionGroupsResult.groupIdByName,
    valueIdByGroupAndValue: optionGroupsResult.valueIdByGroupAndValue,
  });

  if (variantsError) {
    return NextResponse.json(
      { message: variantsError.message ?? "No se pudieron guardar las variantes." },
      { status: 500 },
    );
  }

  const inventoryError = await createVariantInventoryLoad(adminClient, productId, payload.variants ?? []);

  if (inventoryError) {
    return NextResponse.json(
      { message: inventoryError.message ?? "No se pudo registrar el inventario de las variantes." },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Variantes actualizadas correctamente." });
}
