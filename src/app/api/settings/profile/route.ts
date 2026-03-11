import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";

export async function GET() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, status")
    .eq("id", authContext.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo cargar el perfil." },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile: profile ? { ...profile, isAdmin: authContext.isAdmin } : null });
}

export async function PUT(request: Request) {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const payload = await request.json();
  const fullName: string | undefined = payload?.fullName;

  if (typeof fullName !== "string" || fullName.trim().length === 0) {
    return NextResponse.json(
      { message: "El nombre no puede estar vacío." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName.trim() })
    .eq("id", authContext.user.id);

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo actualizar el perfil." },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Perfil actualizado correctamente." });
}
