import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const AVATARS_BUCKET = "avatars";

function sanitizeSegment(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "avatar"
  );
}

export async function POST(request: Request) {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const serverClient = await createClient();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Selecciona un archivo válido." },
      { status: 400 },
    );
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const filePath = `${authContext.user.id}/${randomUUID()}.${sanitizeSegment(extension ?? "bin")}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from(AVATARS_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { message: uploadError.message ?? "No se pudo subir el avatar." },
      { status: 500 },
    );
  }

  const { data } = adminClient.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);
  const avatarUrl = data.publicUrl;

  const { error: updateError } = await serverClient
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", authContext.user.id);

  if (updateError) {
    return NextResponse.json(
      { message: updateError.message ?? "No se pudo guardar la URL del avatar." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { message: "Avatar actualizado correctamente.", avatarUrl },
    { status: 201 },
  );
}
