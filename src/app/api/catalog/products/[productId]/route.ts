import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "../../../../../../types/supabase";

function extractStoreIdFromMetadata(metadata: Json | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  return typeof metadata.storeId === "string" ? metadata.storeId : null;
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
  const [
    { data: product, error: productError },
    { data: categoryRelations, error: categoryRelationsError },
    { data: categories, error: categoriesError },
    { data: brands, error: brandsError },
    { data: variants, error: variantsError },
    { data: balances, error: balancesError },
    { data: locations, error: locationsError },
    { data: images, error: imagesError },
    { data: optionGroups, error: optionGroupsError },
    { data: optionGroupValues, error: optionGroupValuesError },
  ] = await Promise.all([
    adminClient
      .from("products")
      .select("id, slug, sku, name, description, brand_id, product_type, status, track_inventory, is_sellable, is_purchasable, base_unit, image_url, metadata, created_at, updated_at")
      .eq("id", productId)
      .is("deleted_at", null)
      .maybeSingle(),
    adminClient.from("product_categories").select("product_id, category_id").eq("product_id", productId),
    adminClient.from("categories").select("id, name, slug"),
    adminClient.from("brands").select("id, name, slug"),
    adminClient
      .from("product_variants")
      .select("id, product_id, name, sku, barcode, price_cents, compare_at_price_cents, cost_cents, is_default, is_active, option_values, unit_value, unit_label, pack_size, volume_ml, abv, created_at, updated_at")
      .eq("product_id", productId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    adminClient.from("inventory_balances").select("location_id, variant_id, on_hand_qty, reserved_qty, available_qty").not("variant_id", "is", null),
    adminClient.from("inventory_locations").select("id, name, code"),
    adminClient.from("product_images").select("id, product_id, variant_id, storage_path, alt_text, sort_order, created_at").eq("product_id", productId),
    adminClient.from("product_option_groups").select("id, product_id, name, sort_order").eq("product_id", productId).order("sort_order", { ascending: true }),
    adminClient.from("product_option_group_values").select("id, option_group_id, value, sort_order").order("sort_order", { ascending: true }),
  ]);

  if (
    productError ||
    categoryRelationsError ||
    categoriesError ||
    brandsError ||
    variantsError ||
    balancesError ||
    locationsError ||
    imagesError ||
    optionGroupsError ||
    optionGroupValuesError
  ) {
    return NextResponse.json(
      { message: productError?.message ?? categoryRelationsError?.message ?? categoriesError?.message ?? brandsError?.message ?? variantsError?.message ?? balancesError?.message ?? locationsError?.message ?? imagesError?.message ?? optionGroupsError?.message ?? optionGroupValuesError?.message ?? "No se pudo cargar el producto." },
      { status: 500 },
    );
  }

  if (!product) {
    return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
  }

  const categoriesById = new Map((categories ?? []).map((category) => [category.id, category]));
  const brandsById = new Map((brands ?? []).map((brand) => [brand.id, brand]));
  const locationsById = new Map((locations ?? []).map((location) => [location.id, location]));
  const optionGroupValuesByGroupId = new Map<string, Array<{ id: string; optionGroupId: string; value: string; sortOrder: number }>>();

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

  return NextResponse.json({
    product: {
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
      categories: (categoryRelations ?? []).flatMap((relation) => {
        const category = categoriesById.get(relation.category_id);

        if (!category) {
          return [];
        }

        return [{ id: category.id, name: category.name, slug: category.slug }];
      }),
      images: (images ?? []).map((image) => ({
        id: image.id,
        productId: image.product_id,
        variantId: image.variant_id,
        storagePath: image.storage_path,
        altText: image.alt_text,
        sortOrder: image.sort_order,
        createdAt: image.created_at,
        publicUrl: image.storage_path,
      })),
      optionGroups: (optionGroups ?? []).map((group) => ({
        id: group.id,
        productId: group.product_id,
        name: group.name,
        sortOrder: group.sort_order,
        values: optionGroupValuesByGroupId.get(group.id) ?? [],
      })),
      variants: (variants ?? []).map((variant) => ({
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
        inventoryBalances: (balances ?? []).flatMap((balance) => {
          if (balance.variant_id !== variant.id) {
            return [];
          }

          const location = locationsById.get(balance.location_id);

          if (!location) {
            return [];
          }

          return [{
            locationId: balance.location_id,
            locationName: location.name,
            locationCode: location.code,
            onHandQty: balance.on_hand_qty ?? 0,
            reservedQty: balance.reserved_qty ?? 0,
            availableQty: balance.available_qty ?? 0,
          }];
        }),
        createdAt: variant.created_at,
        updatedAt: variant.updated_at,
      })),
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    },
  });
}
