import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createProductRequestSchema,
  updateProductRequestSchema,
} from "@/features/catalog/schemas";
import type {
  CategoryOption,
  CreateProductResponse,
  ProductListItem,
  ProductVariantListItem,
  ProductsListResponse,
  UpdateProductResponse,
  VariantInventoryBalanceItem,
} from "@/features/catalog/catalog.types";
import type { Json } from "../../../../../types/supabase";

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
    optionValues: Array<{ key: string; value: string }>;
    unitValue: number | null;
    unitLabel?: string;
    packSize: number | null;
    volumeMl: number | null;
    abv: number | null;
    initialStockQty: number;
  }>,
) {
  const { data: existingVariants, error: existingVariantsError } = await adminClient
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  if (existingVariantsError) {
    return existingVariantsError;
  }

  const variantsPayload = variants.map((variant) => {
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
      option_values: variant.optionValues as Json,
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

  if (variantsPayload.length > 0) {
    const upsertResult = await adminClient.from("product_variants").upsert(variantsPayload);

    if (upsertResult.error) {
      return upsertResult.error;
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

export async function GET() {
  const catalogRequest = await requireCatalogRequest();

  if (catalogRequest.error) {
    return catalogRequest.error;
  }

  const adminClient = createAdminClient();
  const [
    { data: products, error: productsError },
    { data: productCategories, error: productCategoriesError },
    { data: categories, error: categoriesError },
    { data: variants, error: variantsError },
    { data: inventoryBalances, error: inventoryBalancesError },
    { data: inventoryLocations, error: inventoryLocationsError },
  ] = await Promise.all([
    adminClient
      .from("products")
      .select(
        "id, slug, sku, name, description, product_type, status, track_inventory, is_sellable, is_purchasable, base_unit, image_url, created_at, updated_at",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    adminClient.from("product_categories").select("product_id, category_id"),
    adminClient.from("categories").select("id, name, slug"),
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
  ]);

  if (
    productsError ||
    productCategoriesError ||
    categoriesError ||
    variantsError ||
    inventoryBalancesError ||
    inventoryLocationsError
  ) {
    return NextResponse.json(
      {
        message:
          productsError?.message ??
          productCategoriesError?.message ??
          categoriesError?.message ??
          variantsError?.message ??
          inventoryBalancesError?.message ??
          inventoryLocationsError?.message ??
          "No se pudo cargar el listado de productos.",
      },
      { status: 500 },
    );
  }

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
  const categoriesByProductId = new Map<string, CategoryOption[]>();
  const variantsByProductId = new Map<string, ProductVariantListItem[]>();
  const inventoryLocationById = new Map(
    (inventoryLocations ?? []).map((location) => [location.id, location]),
  );
  const inventoryBalancesByVariantId = new Map<string, VariantInventoryBalanceItem[]>();

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

  const responseBody: ProductsListResponse = {
    products: (products ?? []).map((product): ProductListItem => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      status: product.status,
      productType: product.product_type,
      trackInventory: product.track_inventory,
      isSellable: product.is_sellable,
      isPurchasable: product.is_purchasable,
      baseUnit: product.base_unit,
      imageUrl: product.image_url,
      categories: categoriesByProductId.get(product.id) ?? [],
      variants: variantsByProductId.get(product.id) ?? [],
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    })),
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
    variants,
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
      description: description.trim() || null,
      status,
      product_type: productType,
      track_inventory: trackInventory,
      is_sellable: isSellable,
      is_purchasable: isPurchasable,
      base_unit: baseUnit,
      image_url: imageUrl.trim() || null,
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

  const variantsError = await syncProductVariants(adminClient, createdProduct.id, variants);

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
    variants,
  } = parsedPayload.data;

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
      description: description.trim() || null,
      status,
      product_type: productType,
      track_inventory: trackInventory,
      is_sellable: isSellable,
      is_purchasable: isPurchasable,
      base_unit: baseUnit,
      image_url: imageUrl.trim() || null,
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

  const variantsError = await syncProductVariants(adminClient, id, variants);

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
