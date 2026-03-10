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
    .from("business_settings")
    .select("id, name, logo_url")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo cargar la configuración del negocio." },
      { status: 500 },
    );
  }

  return NextResponse.json({ business: data });
}

export async function PUT(request: Request) {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  if (!authContext.isAdmin) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const payload = await request.json();
  const name: string | undefined = payload?.name;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { message: "El nombre del negocio no puede estar vacío." },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();

  // Get the singleton record id first
  const { data: existing } = await adminClient
    .from("business_settings")
    .select("id")
    .maybeSingle();

  if (!existing) {
    const { error } = await adminClient
      .from("business_settings")
      .insert({ name: name.trim() });

    if (error) {
      return NextResponse.json(
        { message: error.message ?? "No se pudo crear la configuración del negocio." },
        { status: 500 },
      );
    }
  } else {
    const { error } = await adminClient
      .from("business_settings")
      .update({ name: name.trim() })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json(
        { message: error.message ?? "No se pudo actualizar el negocio." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ message: "Negocio actualizado correctamente." });
}
