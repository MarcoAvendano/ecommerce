import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildSupplierAddress,
  mapSupplierRow,
  normalizeNullable,
  requireSuppliersRequest,
} from "@/app/api/_lib/suppliers";
import {
  createSupplierSchema,
  updateSupplierSchema,
  type CreateSupplierInput,
  type UpdateSupplierInput,
} from "@/features/suppliers/schemas";
import type {
  DeleteSupplierResponse,
  SupplierMutationResponse,
  SuppliersListResponse,
} from "@/features/suppliers/suppliers.types";

function isDuplicateSupplierError(message: string | undefined) {
  return Boolean(message && message.toLowerCase().includes("suppliers_name_key"));
}

export async function GET() {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("suppliers")
    .select("id, name, email, phone, tax_id, payment_terms_days, is_active, address, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudieron cargar los proveedores." },
      { status: 500 },
    );
  }

  const responseBody: SuppliersListResponse = {
    suppliers: (data ?? []).map(mapSupplierRow),
  };

  return NextResponse.json(responseBody);
}

export async function POST(request: Request) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const payload = await request.json().catch(() => null);
  const parsedPayload = createSupplierSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: "Datos invalidos.", errors: parsedPayload.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const input: CreateSupplierInput = parsedPayload.data;
  const { data, error } = await adminClient
    .from("suppliers")
    .insert({
      name: input.name.trim(),
      email: normalizeNullable(input.email),
      phone: normalizeNullable(input.phone),
      tax_id: normalizeNullable(input.taxId),
      payment_terms_days: input.paymentTermsDays,
      is_active: input.isActive,
      address: buildSupplierAddress(input.address),
    })
    .select("id, name, email, phone, tax_id, payment_terms_days, is_active, address, created_at, updated_at")
    .single();

  if (error || !data) {
    const message = isDuplicateSupplierError(error?.message)
      ? "Ya existe un proveedor con ese nombre."
      : error?.message ?? "No se pudo crear el proveedor.";

    return NextResponse.json({ message }, { status: 400 });
  }

  const responseBody: SupplierMutationResponse = {
    message: "Proveedor creado correctamente.",
    supplier: mapSupplierRow(data),
  };

  return NextResponse.json(responseBody, { status: 201 });
}

export async function PUT(request: Request) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const payload = await request.json().catch(() => null);
  const parsedPayload = updateSupplierSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: "Datos invalidos.", errors: parsedPayload.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const input: UpdateSupplierInput = parsedPayload.data;
  const { data, error } = await adminClient
    .from("suppliers")
    .update({
      name: input.name.trim(),
      email: normalizeNullable(input.email),
      phone: normalizeNullable(input.phone),
      tax_id: normalizeNullable(input.taxId),
      payment_terms_days: input.paymentTermsDays,
      is_active: input.isActive,
      address: buildSupplierAddress(input.address),
    })
    .eq("id", input.id)
    .select("id, name, email, phone, tax_id, payment_terms_days, is_active, address, created_at, updated_at")
    .maybeSingle();

  if (error) {
    const message = isDuplicateSupplierError(error.message)
      ? "Ya existe un proveedor con ese nombre."
      : error.message ?? "No se pudo actualizar el proveedor.";

    return NextResponse.json({ message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ message: "Proveedor no encontrado." }, { status: 404 });
  }

  const responseBody: SupplierMutationResponse = {
    message: "Proveedor actualizado correctamente.",
    supplier: mapSupplierRow(data),
  };

  return NextResponse.json(responseBody);
}

export async function DELETE(request: Request) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const payload = (await request.json().catch(() => null)) as { id?: string } | null;

  if (!payload?.id) {
    return NextResponse.json({ message: "El proveedor es invalido." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { count: ordersCount, error: ordersError } = await adminClient
    .from("purchase_orders")
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", payload.id);

  if (ordersError) {
    return NextResponse.json(
      { message: ordersError.message ?? "No se pudo validar el proveedor." },
      { status: 500 },
    );
  }

  if ((ordersCount ?? 0) > 0) {
    return NextResponse.json(
      { message: "No puedes eliminar un proveedor con compras registradas." },
      { status: 409 },
    );
  }

  const { data, error } = await adminClient
    .from("suppliers")
    .delete()
    .eq("id", payload.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo eliminar el proveedor." },
      { status: 400 },
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Proveedor no encontrado." }, { status: 404 });
  }

  const responseBody: DeleteSupplierResponse = {
    message: "Proveedor eliminado correctamente.",
  };

  return NextResponse.json(responseBody);
}
