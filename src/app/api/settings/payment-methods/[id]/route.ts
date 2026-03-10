import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  if (!authContext.isAdmin) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const payload = await request.json();
  const { name, code, is_active } = payload ?? {};

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { message: "El nombre es requerido." },
      { status: 400 },
    );
  }

  if (typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json(
      { message: "El código es requerido." },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("payment_methods")
    .update({
      name: name.trim(),
      code: code.trim().toLowerCase().replace(/\s+/g, "_"),
      is_active: typeof is_active === "boolean" ? is_active : true,
    })
    .eq("id", id)
    .select("id, name, code, is_active")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Ya existe un método de pago con ese código." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: error.message ?? "No se pudo actualizar el método de pago." },
      { status: 500 },
    );
  }

  return NextResponse.json({ paymentMethod: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  if (!authContext.isAdmin) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("payment_methods")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo eliminar el método de pago." },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Método de pago eliminado correctamente." });
}
