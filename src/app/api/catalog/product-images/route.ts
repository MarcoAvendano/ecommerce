import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UploadProductImageResponse } from "@/features/catalog/catalog.types";

const PRODUCT_IMAGES_BUCKET = "products";

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "product";
}

export async function POST(request: Request) {
  const adminClient = createAdminClient();
  const formData = await request.formData();
  const file = formData.get("file");
  const slug = formData.get("slug");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Selecciona un archivo valido." }, { status: 400 });
  }

  const sanitizedSlug = sanitizeSegment(typeof slug === "string" ? slug : file.name);
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const filePath = `catalog/${sanitizedSlug}-${randomUUID()}.${sanitizeSegment(extension ?? "bin")}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { message: uploadError.message ?? "No se pudo subir la imagen." },
      { status: 500 },
    );
  }

  const { data } = adminClient.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

  const responseBody: UploadProductImageResponse = {
    message: "Imagen subida correctamente.",
    path: filePath,
    publicUrl: data.publicUrl,
  };

  return NextResponse.json(responseBody, { status: 201 });
}