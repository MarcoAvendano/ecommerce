import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_methods")
    .select("id, name, code, is_active, created_at")
    .order("name");

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudieron cargar los métodos de pago." },
      { status: 500 },
    );
  }

  return NextResponse.json({ paymentMethods: data ?? [] });
}

export async function POST(request: Request) {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  if (!authContext.isAdmin) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

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
    .insert({
      name: name.trim(),
      code: code.trim().toLowerCase().replace(/\s+/g, "_"),
      is_active: typeof is_active === "boolean" ? is_active : true,
    })
    .select("id, name, code, is_active, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Ya existe un método de pago con ese código." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: error.message ?? "No se pudo crear el método de pago." },
      { status: 500 },
    );
  }

  return NextResponse.json({ paymentMethod: data }, { status: 201 });
}
