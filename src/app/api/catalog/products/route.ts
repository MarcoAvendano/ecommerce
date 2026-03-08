import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createProductRequestSchema,
  updateProductRequestSchema,
} from "@/features/catalog/schemas";
import type {
  BrandOption,
  CategoryOption,
  CreateProductResponse,
  ProductImageItem,
  ProductListItem,
  ProductOptionGroupItem,
  ProductOptionGroupValueItem,
  ProductVariantListItem,
  ProductsListResponse,
  UpdateProductResponse,
  VariantInventoryBalanceItem,
} from "@/features/catalog/catalog.types";
import type { Json } from "../../../../../types/supabase";

function extractStoreIdFromMetadata(metadata: Json | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  return typeof metadata.storeId === "string" ? metadata.storeId : null;
}

function buildProductMetadata(existingMetadata: Json | null | undefined, storeId: string | null) {
  const baseMetadata = existingMetadata && typeof existingMetadata === "object" && !Array.isArray(existingMetadata)
    ? { ...existingMetadata }
    : {};

  return {
    ...baseMetadata,
    storeId,
  } satisfies Record<string, Json>;
}

function mapOptionSelections(optionValues: Json | null | undefined) {
  if (!Array.isArray(optionValues)) {
    return [];
  }

  return optionValues.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const record = entry as Record<string, unknown>;

    if (
      typeof record.groupId === "string" &&
      typeof record.groupName === "string" &&
      typeof record.valueId === "string" &&
      typeof record.value === "string"
    ) {
      return [{
        groupId: record.groupId,
        groupName: record.groupName,
        valueId: record.valueId,
        value: record.value,
      }];
    }

    if (typeof record.key === "string" && typeof record.value === "string") {
      return [{
        groupId: `legacy-${record.key}`,
        groupName: record.key,
        valueId: `legacy-${record.key}-${record.value}`,
        value: record.value,
      }];
    }

    return [];
  });
}

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

async function validateCategoryIds(
  adminClient: ReturnType<typeof createAdminClient>,
  categoryIds: string[],
) {
  if (categoryIds.length === 0) {
    return null;
  }

  const { data: categories, error } = await adminClient
    .from("categories")
    .select("id")
    .in("id", categoryIds);

  if (error || (categories?.length ?? 0) !== categoryIds.length) {
    return NextResponse.json(
      {
        message: error?.message ?? "Selecciona categorias validas para el producto.",
      },
      { status: 400 },
    );
  }

  return null;
}

async function syncProductCategories(
  adminClient: ReturnType<typeof createAdminClient>,
  productId: string,
  categoryIds: string[],
) {
  const deleteResult = await adminClient
    .from("product_categories")
    .delete()
    .eq("product_id", productId);

  if (deleteResult.error) {
    return deleteResult.error;
  }

  if (categoryIds.length === 0) {
    return null;
  }

  const insertResult = await adminClient.from("product_categories").insert(
    categoryIds.map((categoryId) => ({
      product_id: productId,
      category_id: categoryId,
    })),
  );

  return insertResult.error;
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
    isDefault: boolean;
    isActive: boolean;
    optionValues: Array<Record<string, Json>>;
    optionSelections: Array<{
      groupId: string;
      groupName: string;
      valueId: string;
      value: string;
    }>;
    unitValue: number | null;
    unitLabel?: string;
    packSize: number | null;
    volumeMl: number | null;
    abv: number | null;
    initialStockQty: number;
  }>,
  selectionMaps?: {
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

  const variantsPayload = variants.map((variant) => {
    const nextOptionValues = variant.optionSelections.flatMap((selection) => {
      const optionGroupId = selectionMaps?.groupIdByName.get(selection.groupName) ?? selection.groupId;
      const optionValueId = selectionMaps?.valueIdByGroupAndValue.get(`${optionGroupId}:${selection.value}`) ?? selection.valueId;

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
      is_default: variant.isDefault,
      is_active: variant.isActive,
      option_values: nextOptionValues as Json,
      unit_value: variant.unitValue,
      unit_label: variant.unitLabel?.trim() || null,
      pack_size: variant.packSize,
      volume_ml: variant.volumeMl,
      abv: variant.abv,
    };

    return variant.id
      ? {
          id: variant.id,
          ...basePayload,
        }
      : basePayload;
  });

  const updatePayload = variantsPayload.filter((variant) => "id" in variant);
  const insertPayload = variantsPayload.filter((variant) => !("id" in variant));

  if (updatePayload.length > 0) {
    const upsertResult = await adminClient.from("product_variants").upsert(updatePayload);

    if (upsertResult.error) {
      return upsertResult.error;
    }
  }

  if (insertPayload.length > 0) {
    const insertResult = await adminClient.from("product_variants").insert(insertPayload);

    if (insertResult.error) {
      return insertResult.error;
    }
  }

  const keepVariantIds = variants.flatMap((variant) => (variant.id ? [variant.id] : []));
  const removableVariantIds = (existingVariants ?? [])
    .map((variant) => variant.id)
    .filter((variantId) => !keepVariantIds.includes(variantId));

  if (removableVariantIds.length > 0) {
    const deleteResult = await adminClient
      .from("product_variants")
      .delete()
      .eq("product_id", productId)
      .in("id", removableVariantIds);

    if (deleteResult.error) {
      return deleteResult.error;
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

  if (variantIds.length > 0 && selectionMaps) {
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
  }

  return null;
}

async function createInitialInventoryLoad(
  adminClient: ReturnType<typeof createAdminClient>,
  productId: string,
  locationId: string | null,
  variants: Array<{
    sku: string;
    initialStockQty: number;
    costCents: number;
  }>,
) {
  if (!locationId) {
    return null;
  }

  const variantsWithStock = variants.filter((variant) => variant.initialStockQty > 0);

  if (variantsWithStock.length === 0) {
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

    return [
      {
        location_id: locationId,
        product_id: productId,
        variant_id: variantId,
        movement_type: "initial_load",
        quantity: variant.initialStockQty,
        unit_cost_cents: variant.costCents,
        reference_type: "product",
        reference_id: productId,
        notes: "Carga inicial al crear producto.",
      },
    ];
  });

  if (movementPayload.length === 0) {
    return null;
  }

  const { error: movementError } = await adminClient.from("inventory_movements").insert(movementPayload);

  return movementError;
}

async function loadCatalogProductRows(adminClient: ReturnType<typeof createAdminClient>) {
  return Promise.all([
    adminClient
      .from("products")
      .select(
        "id, slug, sku, name, description, brand_id, product_type, status, track_inventory, is_sellable, is_purchasable, base_unit, image_url, metadata, created_at, updated_at",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    adminClient.from("product_categories").select("product_id, category_id"),
    adminClient.from("categories").select("id, name, slug"),
    adminClient.from("brands").select("id, name, slug"),
    adminClient
      .from("product_variants")
      .select(
        "id, product_id, name, sku, barcode, price_cents, compare_at_price_cents, cost_cents, is_default, is_active, option_values, unit_value, unit_label, pack_size, volume_ml, abv, created_at, updated_at",
      )
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    adminClient
      .from("inventory_balances")
      .select("location_id, variant_id, on_hand_qty, reserved_qty, available_qty")
      .not("variant_id", "is", null),
    adminClient.from("inventory_locations").select("id, name, code"),
    adminClient.from("product_images").select("id, product_id, variant_id, storage_path, alt_text, sort_order, created_at"),
    adminClient.from("product_option_groups").select("id, product_id, name, sort_order").order("sort_order", { ascending: true }),
    adminClient
      .from("product_option_group_values")
      .select("id, option_group_id, value, sort_order")
      .order("sort_order", { ascending: true }),
  ]);
}

function buildProductMap(rows: Awaited<ReturnType<typeof loadCatalogProductRows>>) {
  const [
    { data: products },
    { data: productCategories },
    { data: categories },
    { data: brands },
    { data: variants },
    { data: inventoryBalances },
    { data: inventoryLocations },
    { data: productImages },
    { data: optionGroups },
    { data: optionGroupValues },
  ] = rows;

  const categoriesById = new Map<string, CategoryOption>(
    (categories ?? []).map((category) => [
      category.id,
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
    ]),
  );
  const brandsById = new Map<string, BrandOption>(
    (brands ?? []).map((brand) => [
      brand.id,
      {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
      },
    ]),
  );
  const inventoryLocationById = new Map(
    (inventoryLocations ?? []).map((location) => [location.id, location]),
  );
  const categoriesByProductId = new Map<string, CategoryOption[]>();
  const inventoryBalancesByVariantId = new Map<string, VariantInventoryBalanceItem[]>();
  const imagesByProductId = new Map<string, ProductImageItem[]>();
  const optionGroupValuesByGroupId = new Map<string, ProductOptionGroupValueItem[]>();
  const optionGroupsByProductId = new Map<string, ProductOptionGroupItem[]>();
  const variantsByProductId = new Map<string, ProductVariantListItem[]>();

  for (const relation of productCategories ?? []) {
    const category = categoriesById.get(relation.category_id);

    if (!category) {
      continue;
    }

    const currentCategories = categoriesByProductId.get(relation.product_id) ?? [];
    currentCategories.push(category);
    categoriesByProductId.set(relation.product_id, currentCategories);
  }

  for (const balance of inventoryBalances ?? []) {
    if (!balance.variant_id) {
      continue;
    }

    const location = inventoryLocationById.get(balance.location_id);

    if (!location) {
      continue;
    }

    const currentBalances = inventoryBalancesByVariantId.get(balance.variant_id) ?? [];
    currentBalances.push({
      locationId: balance.location_id,
      locationName: location.name,
      locationCode: location.code,
      onHandQty: balance.on_hand_qty ?? 0,
      reservedQty: balance.reserved_qty ?? 0,
      availableQty: balance.available_qty ?? 0,
    });
    inventoryBalancesByVariantId.set(balance.variant_id, currentBalances);
  }

  for (const image of productImages ?? []) {
    const currentImages = imagesByProductId.get(image.product_id) ?? [];
    currentImages.push({
      id: image.id,
      productId: image.product_id,
      variantId: image.variant_id,
      storagePath: image.storage_path,
      altText: image.alt_text,
      sortOrder: image.sort_order,
      createdAt: image.created_at,
      publicUrl: image.storage_path,
    });
    imagesByProductId.set(image.product_id, currentImages);
  }

  for (const optionGroupValue of optionGroupValues ?? []) {
    const currentValues = optionGroupValuesByGroupId.get(optionGroupValue.option_group_id) ?? [];
    currentValues.push({
      id: optionGroupValue.id,
      optionGroupId: optionGroupValue.option_group_id,
      value: optionGroupValue.value,
      sortOrder: optionGroupValue.sort_order,
    });
    optionGroupValuesByGroupId.set(optionGroupValue.option_group_id, currentValues);
  }

  for (const optionGroup of optionGroups ?? []) {
    const currentGroups = optionGroupsByProductId.get(optionGroup.product_id) ?? [];
    currentGroups.push({
      id: optionGroup.id,
      productId: optionGroup.product_id,
      name: optionGroup.name,
      sortOrder: optionGroup.sort_order,
      values: optionGroupValuesByGroupId.get(optionGroup.id) ?? [],
    });
    optionGroupsByProductId.set(optionGroup.product_id, currentGroups);
  }

  for (const variant of variants ?? []) {
    const currentVariants = variantsByProductId.get(variant.product_id) ?? [];
    currentVariants.push({
      id: variant.id,
      productId: variant.product_id,
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode,
      priceCents: variant.price_cents,
      compareAtPriceCents: variant.compare_at_price_cents,
      costCents: variant.cost_cents,
      isDefault: variant.is_default,
      isActive: variant.is_active,
      optionValues: variant.option_values,
      optionSelections: mapOptionSelections(variant.option_values),
      unitValue: variant.unit_value,
      unitLabel: variant.unit_label,
      packSize: variant.pack_size,
      volumeMl: variant.volume_ml,
      abv: variant.abv,
      inventoryBalances: inventoryBalancesByVariantId.get(variant.id) ?? [],
      createdAt: variant.created_at,
      updatedAt: variant.updated_at,
    });
    variantsByProductId.set(variant.product_id, currentVariants);
  }

  return (products ?? []).map((product): ProductListItem => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    status: product.status,
    productType: product.product_type,
    brandId: product.brand_id,
    trackInventory: product.track_inventory,
    isSellable: product.is_sellable,
    isPurchasable: product.is_purchasable,
    baseUnit: product.base_unit,
    imageUrl: product.image_url,
    storeId: extractStoreIdFromMetadata(product.metadata),
    brand: product.brand_id ? brandsById.get(product.brand_id) ?? null : null,
    categories: categoriesByProductId.get(product.id) ?? [],
    images: imagesByProductId.get(product.id) ?? [],
    optionGroups: optionGroupsByProductId.get(product.id) ?? [],
    variants: variantsByProductId.get(product.id) ?? [],
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }));
}

export async function GET() {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const adminClient = createAdminClient();
  const rows = await loadCatalogProductRows(adminClient);
  const errors = rows.flatMap((result) => (result.error ? [result.error.message] : []));

  if (errors.length > 0) {
    return NextResponse.json(
      {
        message: errors[0] ?? "No se pudo cargar el listado de productos.",
      },
      { status: 500 },
    );
  }

  const responseBody: ProductsListResponse = {
    products: buildProductMap(rows),
  };

  return NextResponse.json(responseBody);
}

export async function POST(request: Request) {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const payload = await request.json();
  const parsedPayload = createProductRequestSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        message: "Datos invalidos.",
        errors: parsedPayload.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const {
    name,
    slug,
    sku,
    description,
    status,
    productType,
    trackInventory,
    isSellable,
    isPurchasable,
    baseUnit,
    imageUrl,
    initialLocationId,
    categoryIds,
    optionGroups,
    variants,
    brandId,
  } = parsedPayload.data;

  const categoryValidationError = await validateCategoryIds(adminClient, categoryIds);

  if (categoryValidationError) {
    return categoryValidationError;
  }

  const { data: createdProduct, error: createProductError } = await adminClient
    .from("products")
    .insert({
      name,
      slug,
      sku,
      brand_id: brandId,
      description: description.trim() || null,
      status,
      product_type: productType,
      track_inventory: trackInventory,
      is_sellable: isSellable,
      is_purchasable: isPurchasable,
      base_unit: baseUnit,
      image_url: imageUrl.trim() || null,
      metadata: buildProductMetadata(null, initialLocationId),
    })
    .select("id")
    .single();

  if (createProductError || !createdProduct) {
    const statusCode = createProductError?.code === "23505" ? 409 : 400;
    const message =
      createProductError?.code === "23505"
        ? "Ya existe un producto con el mismo slug o SKU."
        : createProductError?.message ?? "No se pudo crear el producto.";

    return NextResponse.json({ message }, { status: statusCode });
  }

  const relationsError = await syncProductCategories(adminClient, createdProduct.id, categoryIds);

  if (relationsError) {
    await adminClient.from("products").delete().eq("id", createdProduct.id);

    return NextResponse.json(
      { message: relationsError.message ?? "No se pudieron guardar las categorias del producto." },
      { status: 500 },
    );
  }

  const optionGroupsResult = await syncProductOptionGroups(adminClient, createdProduct.id, optionGroups);

  if (optionGroupsResult.error) {
    await adminClient.from("products").delete().eq("id", createdProduct.id);

    return NextResponse.json(
      { message: optionGroupsResult.error.message ?? "No se pudieron guardar los grupos de opciones." },
      { status: 500 },
    );
  }

  const variantsError = await syncProductVariants(adminClient, createdProduct.id, variants, {
    groupIdByName: optionGroupsResult.groupIdByName,
    valueIdByGroupAndValue: optionGroupsResult.valueIdByGroupAndValue,
  });

  if (variantsError) {
    await adminClient.from("products").delete().eq("id", createdProduct.id);

    return NextResponse.json(
      { message: variantsError.message ?? "No se pudieron guardar las variantes del producto." },
      { status: 500 },
    );
  }

  const initialInventoryError = await createInitialInventoryLoad(
    adminClient,
    createdProduct.id,
    initialLocationId,
    variants,
  );

  if (initialInventoryError) {
    await adminClient.from("products").delete().eq("id", createdProduct.id);

    return NextResponse.json(
      { message: initialInventoryError.message ?? "No se pudo registrar el inventario inicial." },
      { status: 500 },
    );
  }

  const responseBody: CreateProductResponse = {
    message: "Producto creado correctamente.",
  };

  return NextResponse.json(responseBody, { status: 201 });
}

export async function PUT(request: Request) {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const payload = await request.json();
  const parsedPayload = updateProductRequestSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        message: "Datos invalidos.",
        errors: parsedPayload.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const {
    id,
    name,
    slug,
    sku,
    description,
    status,
    productType,
    trackInventory,
    isSellable,
    isPurchasable,
    baseUnit,
    imageUrl,
    initialLocationId,
    categoryIds,
    optionGroups,
    variants,
    brandId,
  } = parsedPayload.data;

  const { data: existingProduct, error: existingProductError } = await adminClient
    .from("products")
    .select("id, metadata")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingProductError) {
    return NextResponse.json(
      { message: existingProductError.message ?? "No se pudo cargar el producto actual." },
      { status: 500 },
    );
  }

  if (!existingProduct) {
    return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
  }

  const categoryValidationError = await validateCategoryIds(adminClient, categoryIds);

  if (categoryValidationError) {
    return categoryValidationError;
  }

  const { data: updatedProduct, error: updateProductError } = await adminClient
    .from("products")
    .update({
      name,
      slug,
      sku,
      brand_id: brandId,
      description: description.trim() || null,
      status,
      product_type: productType,
      track_inventory: trackInventory,
      is_sellable: isSellable,
      is_purchasable: isPurchasable,
      base_unit: baseUnit,
      image_url: imageUrl.trim() || null,
      metadata: buildProductMetadata(existingProduct.metadata, initialLocationId),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (updateProductError) {
    const statusCode = updateProductError.code === "23505" ? 409 : 400;
    const message =
      updateProductError.code === "23505"
        ? "Ya existe un producto con el mismo slug o SKU."
        : updateProductError.message ?? "No se pudo actualizar el producto.";

    return NextResponse.json({ message }, { status: statusCode });
  }

  if (!updatedProduct) {
    return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
  }

  const relationsError = await syncProductCategories(adminClient, id, categoryIds);

  if (relationsError) {
    return NextResponse.json(
      { message: relationsError.message ?? "No se pudieron guardar las categorias del producto." },
      { status: 500 },
    );
  }

  const optionGroupsResult = await syncProductOptionGroups(adminClient, id, optionGroups);

  if (optionGroupsResult.error) {
    return NextResponse.json(
      { message: optionGroupsResult.error.message ?? "No se pudieron guardar los grupos de opciones." },
      { status: 500 },
    );
  }

  const variantsError = await syncProductVariants(adminClient, id, variants, {
    groupIdByName: optionGroupsResult.groupIdByName,
    valueIdByGroupAndValue: optionGroupsResult.valueIdByGroupAndValue,
  });

  if (variantsError) {
    return NextResponse.json(
      { message: variantsError.message ?? "No se pudieron guardar las variantes del producto." },
      { status: 500 },
    );
  }

  if (initialLocationId) {
    const initialInventoryError = await createInitialInventoryLoad(
      adminClient,
      id,
      initialLocationId,
      variants,
    );

    if (initialInventoryError) {
      return NextResponse.json(
        { message: initialInventoryError.message ?? "No se pudo registrar el inventario inicial." },
        { status: 500 },
      );
    }
  }

  const responseBody: UpdateProductResponse = {
    message: "Producto actualizado correctamente.",
  };

  return NextResponse.json(responseBody);
}
