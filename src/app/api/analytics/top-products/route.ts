import { NextResponse } from "next/server";
import { loadDashboardTopProductsMetrics } from "@/app/api/_lib/dashboard-analytics";
import { parseIntegerParam, requireAnalyticsRequest } from "@/app/api/_lib/analytics-route";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const analyticsRequest = await requireAnalyticsRequest();

  if (analyticsRequest.error) {
    return analyticsRequest.error;
  }

  const now = new Date();
  const { searchParams } = new URL(request.url);
  const parsedYear = parseIntegerParam(searchParams.get("year"), 2000, 2100);
  const parsedMonth = parseIntegerParam(searchParams.get("month"), 1, 12);
  const parsedLimit = parseIntegerParam(searchParams.get("limit"), 1, 20);

  if (Number.isNaN(parsedYear) || Number.isNaN(parsedMonth) || Number.isNaN(parsedLimit)) {
    return NextResponse.json(
      { message: "Los parametros year, month y limit deben ser enteros validos." },
      { status: 400 },
    );
  }

  const year = parsedYear ?? now.getUTCFullYear();
  const month = parsedMonth ?? now.getUTCMonth() + 1;
  const limit = parsedLimit ?? 5;
  const adminClient = createAdminClient();

  try {
    const data = await loadDashboardTopProductsMetrics(adminClient, {
      year,
      month,
      limit,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "No se pudieron cargar los productos mas vendidos.",
      },
      { status: 500 },
    );
  }
}