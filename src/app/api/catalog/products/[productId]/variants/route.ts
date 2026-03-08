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

function extractStoreIdFromMetadata(metadata: Json | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  return typeof metadata.storeId === "string" ? metadata.storeId : null;
}

async function buildSelectionMaps(adminClient: ReturnType<typeof createAdminClient>, productId: string) {
  const [{ data: groups, error: groupsError }, { data: values, error: valuesError }] = await Promise.all([
    adminClient
      .from("product_option_groups")
      .select("id, name")
      .eq("product_id", productId),
    adminClient
      .from("product_option_group_values")
      .select("id, option_group_id, value"),
  ]);

  if (groupsError || valuesError) {
    return {
      error: groupsError ?? valuesError ?? new Error("No se pudieron cargar los grupos de opciones."),
      groupIdByName: new Map<string, string>(),
      valueIdByGroupAndValue: new Map<string, string>(),
    };
  }

  return {
    error: null,
    groupIdByName: new Map((groups ?? []).map((group) => [group.name, group.id])),
    valueIdByGroupAndValue: new Map((values ?? []).map((value) => [`${value.option_group_id}:${value.value}`, value.id])),
  };
}

async function persistVariantSelections(
  adminClient: ReturnType<typeof createAdminClient>,
  variantId: string,
  optionSelections: Array<{
    groupId: string;
    groupName: string;
    valueId: string;
    value: string;
  }>,
  selectionMaps: {
    groupIdByName: Map<string, string>;
    valueIdByGroupAndValue: Map<string, string>;
  },
) {
  const normalizedSelections = optionSelections.flatMap((selection) => {
    const optionGroupId = selectionMaps.groupIdByName.get(selection.groupName) ?? selection.groupId;
    const optionGroupValueId = selectionMaps.valueIdByGroupAndValue.get(`${optionGroupId}:${selection.value}`) ?? selection.valueId;

    if (!optionGroupId || !optionGroupValueId) {
      return [];
    }

    return [{
      groupId: optionGroupId,
      groupName: selection.groupName,
      valueId: optionGroupValueId,
      value: selection.value,
    }];
  });

  const { error: deleteSelectionsError } = await adminClient
    .from("product_variant_option_values")
    .delete()
    .eq("product_variant_id", variantId);

  if (deleteSelectionsError) {
    return deleteSelectionsError;
  }

  if (normalizedSelections.length > 0) {
    const { error: insertSelectionsError } = await adminClient
      .from("product_variant_option_values")
      .insert(
        normalizedSelections.map((selection) => ({
          product_variant_id: variantId,
          option_group_id: selection.groupId,
          option_group_value_id: selection.valueId,
        })),
      );

    if (insertSelectionsError) {
      return insertSelectionsError;
    }
  }

  const { error: updateVariantError } = await adminClient
    .from("product_variants")
    .update({ option_values: normalizedSelections as Json })
    .eq("id", variantId);

  return updateVariantError;
}

async function createVariantInventoryLoad(
  adminClient: ReturnType<typeof createAdminClient>,
  productId: string,
  variantId: string,
  initialStockQty: number,
  costCents: number,
) {
  if (initialStockQty <= 0) {
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

  const { error: movementError } = await adminClient
    .from("inventory_movements")
    .insert({
      location_id: locationId,
      product_id: productId,
      variant_id: variantId,
      movement_type: "initial_load",
      quantity: initialStockQty,
      unit_cost_cents: costCents,
      reference_type: "product",
      reference_id: productId,
      notes: "Carga inicial desde gestion de variantes.",
    });

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
    variant: {
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
    };
  };

  const adminClient = createAdminClient();
  const variant = payload.variant;

  if (!variant) {
    return NextResponse.json({ message: "No se recibio la variante." }, { status: 400 });
  }

  if (variant.id) {
    const { data: existingVariant, error: existingVariantError } = await adminClient
      .from("product_variants")
      .select("id")
      .eq("id", variant.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingVariantError) {
      return NextResponse.json({ message: existingVariantError.message ?? "No se pudo validar la variante." }, { status: 500 });
    }

    if (!existingVariant) {
      return NextResponse.json({ message: "La variante no existe para este producto." }, { status: 404 });
    }

    if (variant.initialStockQty > 0) {
      return NextResponse.json({ message: "No puedes modificar el stock inicial de una variante ya creada." }, { status: 400 });
    }
  }

  const selectionMaps = await buildSelectionMaps(adminClient, productId);

  if (selectionMaps.error) {
    return NextResponse.json({ message: selectionMaps.error.message ?? "No se pudieron cargar las opciones del producto." }, { status: 500 });
  }

  const variantPayload = {
    product_id: productId,
    name: variant.name,
    sku: variant.sku,
    barcode: variant.barcode?.trim() || null,
    price_cents: variant.priceCents,
    compare_at_price_cents: variant.compareAtPriceCents,
    cost_cents: variant.costCents,
    is_active: variant.isActive,
  };

  let variantId = variant.id;

  if (variant.id) {
    const { error: updateError } = await adminClient
      .from("product_variants")
      .update(variantPayload)
      .eq("id", variant.id)
      .eq("product_id", productId);

    if (updateError) {
      return NextResponse.json({ message: updateError.message ?? "No se pudo actualizar la variante." }, { status: 500 });
    }
  } else {
    const { data: defaultVariant, error: defaultVariantError } = await adminClient
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)
      .eq("is_default", true)
      .maybeSingle();

    if (defaultVariantError) {
      return NextResponse.json({ message: defaultVariantError.message ?? "No se pudo validar la variante principal." }, { status: 500 });
    }

    const { data: insertedVariant, error: insertError } = await adminClient
      .from("product_variants")
      .insert({
        ...variantPayload,
        is_default: !defaultVariant,
        option_values: [] as Json,
      })
      .select("id")
      .single();

    if (insertError || !insertedVariant) {
      return NextResponse.json({ message: insertError?.message ?? "No se pudo crear la variante." }, { status: 500 });
    }

    variantId = insertedVariant.id;

    if (!variantId) {
      return NextResponse.json({ message: "No se pudo resolver el identificador de la variante creada." }, { status: 500 });
    }

    const inventoryError = await createVariantInventoryLoad(
      adminClient,
      productId,
      variantId,
      variant.initialStockQty,
      variant.costCents,
    );

    if (inventoryError) {
      return NextResponse.json({ message: inventoryError.message ?? "No se pudo registrar el inventario de la variante." }, { status: 500 });
    }
  }

  if (!variantId) {
    return NextResponse.json({ message: "No se pudo resolver el identificador de la variante." }, { status: 500 });
  }

  const selectionError = await persistVariantSelections(adminClient, variantId, variant.optionSelections, selectionMaps);

  if (selectionError) {
    return NextResponse.json({ message: selectionError.message ?? "No se pudieron guardar las opciones de la variante." }, { status: 500 });
  }

  return NextResponse.json({
    message: variant.id ? "Variante actualizada correctamente." : "Variante creada correctamente.",
    variantId,
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const { productId } = await context.params;
  const payload = (await request.json()) as { variantId?: string };

  if (!payload.variantId) {
    return NextResponse.json({ message: "Debes indicar la variante a eliminar." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: variant, error: variantError } = await adminClient
    .from("product_variants")
    .select("id, is_default")
    .eq("id", payload.variantId)
    .eq("product_id", productId)
    .maybeSingle();

  if (variantError) {
    return NextResponse.json({ message: variantError.message ?? "No se pudo validar la variante." }, { status: 500 });
  }

  if (!variant) {
    return NextResponse.json({ message: "La variante no existe para este producto." }, { status: 404 });
  }

  const { error: deleteError } = await adminClient
    .from("product_variants")
    .delete()
    .eq("id", payload.variantId)
    .eq("product_id", productId);

  if (deleteError) {
    return NextResponse.json({ message: deleteError.message ?? "No se pudo eliminar la variante." }, { status: 500 });
  }

  if (variant.is_default) {
    const { data: nextVariant, error: nextVariantError } = await adminClient
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextVariantError) {
      return NextResponse.json({ message: nextVariantError.message ?? "No se pudo reasignar la variante principal." }, { status: 500 });
    }

    if (nextVariant) {
      const { error: promoteError } = await adminClient
        .from("product_variants")
        .update({ is_default: true })
        .eq("id", nextVariant.id);

      if (promoteError) {
        return NextResponse.json({ message: promoteError.message ?? "No se pudo reasignar la variante principal." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ message: "Variante eliminada correctamente." });
}
