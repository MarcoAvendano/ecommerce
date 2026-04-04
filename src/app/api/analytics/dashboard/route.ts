import { NextResponse } from "next/server";
import type { DashboardAnalyticsResponse } from "@/features/analytics/analytics.types";
import { loadDashboardAnalytics } from "@/app/api/_lib/dashboard-analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthContext, hasAnyRole } from "@/lib/auth";

function parseIntegerParam(value: string | null, min: number, max: number) {
  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < min || parsedValue > max) {
    return Number.NaN;
  }

  return parsedValue;
}

async function requireDashboardAnalyticsRequest() {
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

export async function GET(request: Request) {
  const analyticsRequest = await requireDashboardAnalyticsRequest();

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
    const data = await loadDashboardAnalytics(adminClient, {
      year,
      month,
      limit,
    });

    return NextResponse.json(data as DashboardAnalyticsResponse);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error
          ? error.message
          : "No se pudieron cargar las metricas del dashboard.",
      },
      { status: 500 },
    );
  }
}