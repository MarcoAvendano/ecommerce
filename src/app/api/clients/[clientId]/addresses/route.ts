import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createClientAddressSchema,
  updateClientAddressSchema,
  type CreateClientAddressInput,
  type UpdateClientAddressInput,
} from "@/features/clients/schemas";
import type {
  ClientAddressItem,
  CreateClientAddressResponse,
  DeleteClientAddressResponse,
  UpdateClientAddressResponse,
} from "@/features/clients/clients.types";

function mapAddressRow(row: {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}): ClientAddressItem {
  return {
    id: row.id,
    label: row.label,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeNullable(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

async function requireClientsRequest() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return {
      error: NextResponse.json({ message: "No autenticado." }, { status: 401 }),
    };
  }

  const isAllowed = authContext.isAdmin || (await hasAnyRole(["manager", "cashier"]));

  if (!isAllowed) {
    return {
      error: NextResponse.json({ message: "No autorizado." }, { status: 403 }),
    };
  }

  return { authContext };
}

async function clearDefaultAddress(adminClient: ReturnType<typeof createAdminClient>, clientId: string) {
  const { error } = await adminClient
    .from("customer_addresses")
    .update({ is_default: false })
    .eq("customer_id", clientId)
    .eq("is_default", true);

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const clientsRequest = await requireClientsRequest();

  if (clientsRequest.error) {
    return clientsRequest.error;
  }

  const { clientId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsedPayload = createClientAddressSchema.safeParse({
    ...(payload ?? {}),
    clientId,
  });

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        message: "Datos invalidos.",
        errors: parsedPayload.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const input: CreateClientAddressInput = parsedPayload.data;

  try {
    if (input.isDefault) {
      await clearDefaultAddress(adminClient, clientId);
    }
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo actualizar la direccion predeterminada." },
      { status: 400 },
    );
  }

  const { data, error } = await adminClient
    .from("customer_addresses")
    .insert({
      customer_id: clientId,
      label: input.label.trim(),
      line1: input.line1.trim(),
      line2: normalizeNullable(input.line2),
      city: input.city.trim(),
      state: normalizeNullable(input.state),
      postal_code: normalizeNullable(input.postalCode),
      country: input.country.trim(),
      is_default: input.isDefault,
    })
    .select("id, label, line1, line2, city, state, postal_code, country, is_default, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { message: error?.message ?? "No se pudo crear la direccion." },
      { status: 400 },
    );
  }

  const responseBody: CreateClientAddressResponse = {
    message: "Direccion creada correctamente.",
    address: mapAddressRow(data),
  };

  return NextResponse.json(responseBody, { status: 201 });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const clientsRequest = await requireClientsRequest();

  if (clientsRequest.error) {
    return clientsRequest.error;
  }

  const { clientId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsedPayload = updateClientAddressSchema.safeParse({
    ...(payload ?? {}),
    clientId,
  });

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        message: "Datos invalidos.",
        errors: parsedPayload.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const input: UpdateClientAddressInput = parsedPayload.data;

  try {
    if (input.isDefault) {
      await clearDefaultAddress(adminClient, clientId);
    }
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo actualizar la direccion predeterminada." },
      { status: 400 },
    );
  }

  const { data, error } = await adminClient
    .from("customer_addresses")
    .update({
      label: input.label.trim(),
      line1: input.line1.trim(),
      line2: normalizeNullable(input.line2),
      city: input.city.trim(),
      state: normalizeNullable(input.state),
      postal_code: normalizeNullable(input.postalCode),
      country: input.country.trim(),
      is_default: input.isDefault,
    })
    .eq("id", input.id)
    .eq("customer_id", clientId)
    .select("id, label, line1, line2, city, state, postal_code, country, is_default, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo actualizar la direccion." },
      { status: 400 },
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Direccion no encontrada." }, { status: 404 });
  }

  const responseBody: UpdateClientAddressResponse = {
    message: "Direccion actualizada correctamente.",
    address: mapAddressRow(data),
  };

  return NextResponse.json(responseBody);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const clientsRequest = await requireClientsRequest();

  if (clientsRequest.error) {
    return clientsRequest.error;
  }

  const { clientId } = await context.params;
  const payload = (await request.json().catch(() => null)) as { id?: string } | null;

  if (!payload?.id || typeof payload.id !== "string") {
    return NextResponse.json({ message: "La direccion es invalida." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("customer_addresses")
    .delete()
    .eq("id", payload.id)
    .eq("customer_id", clientId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo eliminar la direccion." },
      { status: 400 },
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Direccion no encontrada." }, { status: 404 });
  }

  const responseBody: DeleteClientAddressResponse = {
    message: "Direccion eliminada correctamente.",
  };

  return NextResponse.json(responseBody);
}
