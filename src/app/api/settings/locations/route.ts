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
    .from("inventory_locations")
    .select("id, name, code, location_type, is_active, created_at")
    .order("name");

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudieron cargar las ubicaciones." },
      { status: 500 },
    );
  }

  return NextResponse.json({ locations: data ?? [] });
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
  const { name, code, location_type, is_active } = payload ?? {};

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
    .from("inventory_locations")
    .insert({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      location_type: typeof location_type === "string" ? location_type : "warehouse",
      is_active: typeof is_active === "boolean" ? is_active : true,
    })
    .select("id, name, code, location_type, is_active, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo crear la ubicación." },
      { status: 500 },
    );
  }

  return NextResponse.json({ location: data }, { status: 201 });
}
