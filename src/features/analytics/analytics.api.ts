import type {
  DashboardAnalyticsParams,
  DashboardAnalyticsResponse,
  DashboardLatestSalesResponse,
  DashboardSalesParams,
  DashboardSalesResponse,
  DashboardTopProductsResponse,
  DashboardWelcomeResponse,
} from "@/features/analytics/analytics.types";

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Ocurrio un error inesperado.");
  }

  return payload as T;
}

export async function getDashboardAnalytics(
  params: DashboardAnalyticsParams = {},
): Promise<DashboardAnalyticsResponse> {
  const searchParams = new URLSearchParams();

  if (typeof params.year === "number") {
    searchParams.set("year", String(params.year));
  }

  if (typeof params.month === "number") {
    searchParams.set("month", String(params.month));
  }

  if (typeof params.limit === "number") {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  const url = query ? `/api/analytics/dashboard?${query}` : "/api/analytics/dashboard";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<DashboardAnalyticsResponse>(response);
}

function buildAnalyticsSearchParams(params: DashboardAnalyticsParams = {}) {
  const searchParams = new URLSearchParams();

  if (typeof params.year === "number") {
    searchParams.set("year", String(params.year));
  }

  if (typeof params.month === "number") {
    searchParams.set("month", String(params.month));
  }

  if (typeof params.limit === "number") {
    searchParams.set("limit", String(params.limit));
  }

  return searchParams;
}

export async function getDashboardWelcome(
  params: DashboardAnalyticsParams = {},
): Promise<DashboardWelcomeResponse> {
  const searchParams = buildAnalyticsSearchParams(params);
  const query = searchParams.toString();
  const url = query ? `/api/analytics/welcome?${query}` : "/api/analytics/welcome";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<DashboardWelcomeResponse>(response);
}

export async function getDashboardSales(
  params: DashboardSalesParams = {},
): Promise<DashboardSalesResponse> {
  const searchParams = buildAnalyticsSearchParams(params);

  if (params.granularity) {
    searchParams.set("granularity", params.granularity);
  }

  const query = searchParams.toString();
  const url = query ? `/api/analytics/sales?${query}` : "/api/analytics/sales";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<DashboardSalesResponse>(response);
}

export async function getDashboardLatestSales(
  params: DashboardAnalyticsParams = {},
): Promise<DashboardLatestSalesResponse> {
  const searchParams = buildAnalyticsSearchParams(params);
  const query = searchParams.toString();
  const url = query ? `/api/analytics/latest-sales?${query}` : "/api/analytics/latest-sales";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<DashboardLatestSalesResponse>(response);
}

export async function getDashboardTopProducts(
  params: DashboardAnalyticsParams = {},
): Promise<DashboardTopProductsResponse> {
  const searchParams = buildAnalyticsSearchParams(params);
  const query = searchParams.toString();
  const url = query ? `/api/analytics/top-products?${query}` : "/api/analytics/top-products";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<DashboardTopProductsResponse>(response);
}