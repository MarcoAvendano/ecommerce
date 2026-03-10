import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ClientAddressItem,
  ClientDetailItem,
  ClientDetailResponse,
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
}): Omit<ClientDetailItem, "addresses"> {
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const clientsRequest = await requireClientsRequest();

  if (clientsRequest.error) {
    return clientsRequest.error;
  }

  const { clientId } = await context.params;
  const adminClient = createAdminClient();
  const [{ data: client, error: clientError }, { data: addresses, error: addressesError }] = await Promise.all([
    adminClient
      .from("customers")
      .select("id, full_name, email, phone, document_type, document_number, notes, created_at, updated_at")
      .eq("id", clientId)
      .maybeSingle(),
    adminClient
      .from("customer_addresses")
      .select("id, label, line1, line2, city, state, postal_code, country, is_default, created_at, updated_at")
      .eq("customer_id", clientId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  if (clientError || addressesError) {
    return NextResponse.json(
      {
        message:
          clientError?.message ?? addressesError?.message ?? "No se pudo cargar el detalle del cliente.",
      },
      { status: 500 },
    );
  }

  if (!client) {
    return NextResponse.json({ message: "Cliente no encontrado." }, { status: 404 });
  }

  const responseBody: ClientDetailResponse = {
    client: {
      ...mapClientRow(client),
      addresses: (addresses ?? []).map(mapAddressRow),
    },
  };

  return NextResponse.json(responseBody);
}
