import { NextResponse } from "next/server";
import { loadDashboardSalesMetrics } from "@/app/api/_lib/dashboard-analytics";
import { parseIntegerParam, requireAnalyticsRequest } from "@/app/api/_lib/analytics-route";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardSalesGranularity } from "@/features/analytics/analytics.types";

function parseGranularityParam(value: string | null): DashboardSalesGranularity | null {
  if (value === null) {
    return null;
  }

  if (value === "day" || value === "week" || value === "month") {
    return value;
  }

  return null;
}

export async function GET(request: Request) {
  const analyticsRequest = await requireAnalyticsRequest();

  if (analyticsRequest.error) {
    return analyticsRequest.error;
  }

  const now = new Date();
  const { searchParams } = new URL(request.url);
  const parsedYear = parseIntegerParam(searchParams.get("year"), 2000, 2100);
  const parsedMonth = parseIntegerParam(searchParams.get("month"), 1, 12);
  const granularity = parseGranularityParam(searchParams.get("granularity"));

  if (Number.isNaN(parsedYear) || Number.isNaN(parsedMonth) || (searchParams.get("granularity") && !granularity)) {
    return NextResponse.json(
      { message: "Los parametros year, month y granularity deben ser validos." },
      { status: 400 },
    );
  }

  const year = parsedYear ?? now.getUTCFullYear();
  const month = parsedMonth ?? now.getUTCMonth() + 1;
  const adminClient = createAdminClient();

  try {
    const data = await loadDashboardSalesMetrics(adminClient, {
      year,
      month,
      granularity: granularity ?? "day",
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "No se pudieron cargar las ventas del dashboard.",
      },
      { status: 500 },
    );
  }
}