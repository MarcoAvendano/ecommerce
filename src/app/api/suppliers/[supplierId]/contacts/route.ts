import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapSupplierContactRow,
  normalizeNullable,
  requireSuppliersRequest,
} from "@/app/api/_lib/suppliers";
import {
  createSupplierContactSchema,
  updateSupplierContactSchema,
  type CreateSupplierContactInput,
  type UpdateSupplierContactInput,
} from "@/features/suppliers/schemas";
import type {
  DeleteSupplierContactResponse,
  SupplierContactMutationResponse,
} from "@/features/suppliers/suppliers.types";

async function ensureSupplierExists(adminClient: ReturnType<typeof createAdminClient>, supplierId: string) {
  const { data, error } = await adminClient
    .from("suppliers")
    .select("id")
    .eq("id", supplierId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ supplierId: string }> },
) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const { supplierId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsedPayload = createSupplierContactSchema.safeParse({ ...(payload ?? {}), supplierId });

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: "Datos invalidos.", errors: parsedPayload.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();

  try {
    const exists = await ensureSupplierExists(adminClient, supplierId);

    if (!exists) {
      return NextResponse.json({ message: "Proveedor no encontrado." }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo validar el proveedor." },
      { status: 500 },
    );
  }

  const input: CreateSupplierContactInput = parsedPayload.data;
  const { data, error } = await adminClient
    .from("supplier_contacts")
    .insert({
      supplier_id: supplierId,
      full_name: input.fullName.trim(),
      email: normalizeNullable(input.email),
      phone: normalizeNullable(input.phone),
      role: normalizeNullable(input.role),
    })
    .select("id, supplier_id, full_name, email, phone, role, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { message: error?.message ?? "No se pudo crear el contacto." },
      { status: 400 },
    );
  }

  const responseBody: SupplierContactMutationResponse = {
    message: "Contacto creado correctamente.",
    contact: mapSupplierContactRow(data),
  };

  return NextResponse.json(responseBody, { status: 201 });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ supplierId: string }> },
) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const { supplierId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsedPayload = updateSupplierContactSchema.safeParse({ ...(payload ?? {}), supplierId });

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: "Datos invalidos.", errors: parsedPayload.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const input: UpdateSupplierContactInput = parsedPayload.data;
  const { data, error } = await adminClient
    .from("supplier_contacts")
    .update({
      full_name: input.fullName.trim(),
      email: normalizeNullable(input.email),
      phone: normalizeNullable(input.phone),
      role: normalizeNullable(input.role),
    })
    .eq("id", input.id)
    .eq("supplier_id", supplierId)
    .select("id, supplier_id, full_name, email, phone, role, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo actualizar el contacto." },
      { status: 400 },
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Contacto no encontrado." }, { status: 404 });
  }

  const responseBody: SupplierContactMutationResponse = {
    message: "Contacto actualizado correctamente.",
    contact: mapSupplierContactRow(data),
  };

  return NextResponse.json(responseBody);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ supplierId: string }> },
) {
  const suppliersRequest = await requireSuppliersRequest();

  if (suppliersRequest.error) {
    return suppliersRequest.error;
  }

  const { supplierId } = await context.params;
  const payload = (await request.json().catch(() => null)) as { id?: string } | null;

  if (!payload?.id) {
    return NextResponse.json({ message: "El contacto es invalido." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("supplier_contacts")
    .delete()
    .eq("id", payload.id)
    .eq("supplier_id", supplierId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo eliminar el contacto." },
      { status: 400 },
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Contacto no encontrado." }, { status: 404 });
  }

  const responseBody: DeleteSupplierContactResponse = {
    message: "Contacto eliminado correctamente.",
  };

  return NextResponse.json(responseBody);
}
