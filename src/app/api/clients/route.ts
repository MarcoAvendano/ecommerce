import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createClientSchema,
  type CreateClientInput,
  updateClientSchema,
  type UpdateClientInput,
} from "@/features/clients/schemas";
import type {
  DeleteClientResponse,
  ClientListItem,
  ClientsListResponse,
  CreateClientResponse,
  UpdateClientResponse,
} from "@/features/clients/clients.types";

function mapClientRow(row: {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  document_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}): ClientListItem {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    documentType: row.document_type,
    documentNumber: row.document_number,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeNullable(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function isDuplicateEmailError(message: string | undefined) {
  return Boolean(message && message.toLowerCase().includes("customers_email_idx"));
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

export async function GET() {
  const clientsRequest = await requireClientsRequest();

  if (clientsRequest.error) {
    return clientsRequest.error;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("customers")
    .select(
      "id, full_name, email, phone, document_type, document_number, notes, created_at, updated_at",
    )
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudieron cargar los clientes." },
      { status: 500 },
    );
  }

  const responseBody: ClientsListResponse = {
    clients: (data ?? []).map(mapClientRow),
  };

  return NextResponse.json(responseBody);
}

export async function POST(request: Request) {
  const clientsRequest = await requireClientsRequest();

  if (clientsRequest.error) {
    return clientsRequest.error;
  }

  const payload = await request.json().catch(() => null);
  const parsedPayload = createClientSchema.safeParse(payload);

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
  const input: CreateClientInput = parsedPayload.data;

  const { data, error } = await adminClient
    .from("customers")
    .insert({
      full_name: input.fullName.trim(),
      email: normalizeNullable(input.email),
      phone: normalizeNullable(input.phone),
      document_type: normalizeNullable(input.documentType),
      document_number: normalizeNullable(input.documentNumber),
      notes: normalizeNullable(input.notes),
    })
    .select(
      "id, full_name, email, phone, document_type, document_number, notes, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    const message = isDuplicateEmailError(error?.message)
      ? "Ya existe un cliente con ese correo."
      : error?.message ?? "No se pudo crear el cliente.";

    return NextResponse.json(
      { message },
      { status: 400 },
    );
  }

  const responseBody: CreateClientResponse = {
    message: "Cliente creado correctamente.",
    client: mapClientRow(data),
  };

  return NextResponse.json(responseBody, { status: 201 });
}

export async function PUT(request: Request) {
  const clientsRequest = await requireClientsRequest();

  if (clientsRequest.error) {
    return clientsRequest.error;
  }

  const payload = await request.json().catch(() => null);
  const parsedPayload = updateClientSchema.safeParse(payload);

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
  const input: UpdateClientInput = parsedPayload.data;

  const { data, error } = await adminClient
    .from("customers")
    .update({
      full_name: input.fullName.trim(),
      email: normalizeNullable(input.email),
      phone: normalizeNullable(input.phone),
      document_type: normalizeNullable(input.documentType),
      document_number: normalizeNullable(input.documentNumber),
      notes: normalizeNullable(input.notes),
    })
    .eq("id", input.id)
    .select(
      "id, full_name, email, phone, document_type, document_number, notes, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    const message = isDuplicateEmailError(error.message)
      ? "Ya existe un cliente con ese correo."
      : error.message ?? "No se pudo actualizar el cliente.";

    return NextResponse.json({ message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ message: "Cliente no encontrado." }, { status: 404 });
  }

  const responseBody: UpdateClientResponse = {
    message: "Cliente actualizado correctamente.",
    client: mapClientRow(data),
  };

  return NextResponse.json(responseBody);
}

export async function DELETE(request: Request) {
  const clientsRequest = await requireClientsRequest();

  if (clientsRequest.error) {
    return clientsRequest.error;
  }

  const payload = (await request.json().catch(() => null)) as { id?: string } | null;

  if (!payload?.id || typeof payload.id !== "string") {
    return NextResponse.json({ message: "El cliente es invalido." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: deletedClient, error } = await adminClient
    .from("customers")
    .delete()
    .eq("id", payload.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudo eliminar el cliente." },
      { status: 400 },
    );
  }

  if (!deletedClient) {
    return NextResponse.json({ message: "Cliente no encontrado." }, { status: 404 });
  }

  const responseBody: DeleteClientResponse = {
    message: "Cliente eliminado correctamente.",
  };

  return NextResponse.json(responseBody);
}
