import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const payload = await request.json();
  const { currentPassword, newPassword, confirmPassword } = payload ?? {};

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { message: "Todos los campos son requeridos." },
      { status: 400 },
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { message: "Las contraseñas nuevas no coinciden." },
      { status: 400 },
    );
  }

  if (typeof newPassword === "string" && newPassword.length < 8) {
    return NextResponse.json(
      { message: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

  // Verify current password by attempting a sign-in
  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authContext.user.email ?? "",
    password: currentPassword,
  });

  if (signInError) {
    return NextResponse.json(
      { message: "La contraseña actual es incorrecta." },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json(
      { message: updateError.message ?? "No se pudo actualizar la contraseña." },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Contraseña actualizada correctamente." });
}
