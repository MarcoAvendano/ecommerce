import { NextResponse } from "next/server";
import { getAuthContext, hasAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ customerId: string }> },
) {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const isAllowed = authContext.isAdmin || (await hasAnyRole(["manager", "cashier"]));

  if (!isAllowed) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const { customerId } = await context.params;
  const adminClient = createAdminClient();

  const { data: addresses, error } = await adminClient
    .from("customer_addresses")
    .select("id, label, line1, line2, city, state, postal_code, country, is_default")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "No se pudieron cargar las direcciones." },
      { status: 500 },
    );
  }

  const responseBody = {
    addresses: (addresses ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      line1: row.line1,
      line2: row.line2,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      isDefault: row.is_default,
    })),
  };

  return NextResponse.json(responseBody);
}
