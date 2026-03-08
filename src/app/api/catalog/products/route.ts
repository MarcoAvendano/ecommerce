import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createProductSchema,
  updateProductSchema,
} from "@/features/catalog/schemas";
import type {
  CategoryOption,
  CreateProductResponse,
  ProductListItem,
  ProductsListResponse,
  UpdateProductResponse,
} from "@/features/catalog/catalog.types";

async function requireAdminRequest() {
  return {
    authContext: null,
    error: null as NextResponse | null,
  };
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

export async function GET() {
  const adminRequest = await requireAdminRequest();

  if (adminRequest.error) {
    return adminRequest.error;
  }

  const adminClient = createAdminClient();
  const [
    { data: products, error: productsError },
    { data: productCategories, error: productCategoriesError },
    { data: categories, error: categoriesError },
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
  ]);

  if (productsError || productCategoriesError || categoriesError) {
    return NextResponse.json(
      {
        message:
          productsError?.message ??
          productCategoriesError?.message ??
          categoriesError?.message ??
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

  for (const relation of productCategories ?? []) {
    const category = categoriesById.get(relation.category_id);

    if (!category) {
      continue;
    }

    const currentCategories = categoriesByProductId.get(relation.product_id) ?? [];
    currentCategories.push(category);
    categoriesByProductId.set(relation.product_id, currentCategories);
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
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    })),
  };

  return NextResponse.json(responseBody);
}

export async function POST(request: Request) {
  const adminRequest = await requireAdminRequest();

  if (adminRequest.error) {
    return adminRequest.error;
  }

  const payload = await request.json();
  const normalizedPayload = {
    ...payload,
    categoryIds: Array.isArray(payload?.categoryIds) ? payload.categoryIds : [],
  };

  const parsedPayload = createProductSchema.safeParse(normalizedPayload);

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
    categoryIds,
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

  const responseBody: CreateProductResponse = {
    message: "Producto creado correctamente.",
  };

  return NextResponse.json(responseBody, { status: 201 });
}

export async function PUT(request: Request) {
  const adminRequest = await requireAdminRequest();

  if (adminRequest.error) {
    return adminRequest.error;
  }

  const payload = await request.json();
  const normalizedPayload = {
    ...payload,
    categoryIds: Array.isArray(payload?.categoryIds) ? payload.categoryIds : [],
  };

  const parsedPayload = updateProductSchema.safeParse(normalizedPayload);

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
    categoryIds,
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

  const responseBody: UpdateProductResponse = {
    message: "Producto actualizado correctamente.",
  };

  return NextResponse.json(responseBody);
}