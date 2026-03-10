import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const BUSINESS_BUCKET = "business";

function sanitizeSegment(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "logo"
  );
}

export async function POST(request: Request) {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  if (!authContext.isAdmin) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const adminClient = createAdminClient();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Selecciona un archivo válido." },
      { status: 400 },
    );
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const filePath = `logo-${randomUUID()}.${sanitizeSegment(extension ?? "bin")}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from(BUSINESS_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { message: uploadError.message ?? "No se pudo subir el logo." },
      { status: 500 },
    );
  }

  const { data } = adminClient.storage.from(BUSINESS_BUCKET).getPublicUrl(filePath);
  const logoUrl = data.publicUrl;

  // Update singleton logo_url
  const { data: existing } = await adminClient
    .from("business_settings")
    .select("id")
    .maybeSingle();

  if (existing) {
    await adminClient
      .from("business_settings")
      .update({ logo_url: logoUrl })
      .eq("id", existing.id);
  } else {
    await adminClient
      .from("business_settings")
      .insert({ logo_url: logoUrl, name: "Mi Negocio" });
  }

  return NextResponse.json(
    { message: "Logo actualizado correctamente.", logoUrl },
    { status: 201 },
  );
}
