import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/features/catalog/schemas";
import type {
  CategoriesListResponse,
  CategoryListItem,
  CreateCategoryResponse,
  UpdateCategoryResponse,
} from "@/features/catalog/catalog.types";

async function requireAdminRequest() {
  return {
    authContext: null,
    error: null as NextResponse | null,
  };
}

export async function GET() {
  const adminRequest = await requireAdminRequest();

  if (adminRequest.error) {
    return adminRequest.error;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("categories")
    .select("id, parent_id, slug, name, description, sort_order, is_active, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudieron cargar las categorias." },
      { status: 500 },
    );
  }

  const categoriesById = new Map((data ?? []).map((category) => [category.id, category]));
  const categories: CategoryListItem[] = (data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    parentId: category.parent_id,
    parentName: category.parent_id ? categoriesById.get(category.parent_id)?.name ?? null : null,
    sortOrder: category.sort_order,
    isActive: category.is_active,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  }));

  const responseBody: CategoriesListResponse = { categories };

  return NextResponse.json(responseBody);
}

export async function POST(request: Request) {
  const adminRequest = await requireAdminRequest();

  if (adminRequest.error) {
    return adminRequest.error;
  }

  const payload = await request.json();
  const parsedPayload = createCategorySchema.safeParse(payload);

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
  const { name, slug, description, parentId, sortOrder, isActive } = parsedPayload.data;

  if (parentId) {
    const { data: parentCategory, error: parentError } = await adminClient
      .from("categories")
      .select("id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError || !parentCategory) {
      return NextResponse.json(
        { message: parentError?.message ?? "La categoria padre no existe." },
        { status: 400 },
      );
    }
  }

  const { error } = await adminClient.from("categories").insert({
    name,
    slug,
    description: description.trim() || null,
    parent_id: parentId,
    sort_order: sortOrder,
    is_active: isActive,
  });

  if (error) {
    const status = error.code === "23505" ? 409 : 400;
    const message =
      error.code === "23505"
        ? "Ya existe una categoria con el mismo slug."
        : error.message ?? "No se pudo crear la categoria.";

    return NextResponse.json({ message }, { status });
  }

  const responseBody: CreateCategoryResponse = {
    message: "Categoria creada correctamente.",
  };

  return NextResponse.json(responseBody, { status: 201 });
}

export async function PUT(request: Request) {
  const adminRequest = await requireAdminRequest();

  if (adminRequest.error) {
    return adminRequest.error;
  }

  const payload = await request.json();
  const parsedPayload = updateCategorySchema.safeParse(payload);

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
  const { id, name, slug, description, parentId, sortOrder, isActive } = parsedPayload.data;

  if (parentId === id) {
    return NextResponse.json(
      { message: "Una categoria no puede ser su propia categoria padre." },
      { status: 400 },
    );
  }

  if (parentId) {
    const { data: parentCategory, error: parentError } = await adminClient
      .from("categories")
      .select("id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError || !parentCategory) {
      return NextResponse.json(
        { message: parentError?.message ?? "La categoria padre no existe." },
        { status: 400 },
      );
    }
  }

  const { data: updatedCategory, error } = await adminClient
    .from("categories")
    .update({
      name,
      slug,
      description: description.trim() || null,
      parent_id: parentId,
      sort_order: sortOrder,
      is_active: isActive,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    const status = error.code === "23505" ? 409 : 400;
    const message =
      error.code === "23505"
        ? "Ya existe una categoria con el mismo slug."
        : error.message ?? "No se pudo actualizar la categoria.";

    return NextResponse.json({ message }, { status });
  }

  if (!updatedCategory) {
    return NextResponse.json({ message: "Categoria no encontrada." }, { status: 404 });
  }

  const responseBody: UpdateCategoryResponse = {
    message: "Categoria actualizada correctamente.",
  };

  return NextResponse.json(responseBody);
}