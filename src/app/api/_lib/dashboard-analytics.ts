import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DashboardAnalyticsResponse,
  DashboardLatestSaleItem,
  DashboardLatestSalesResponse,
  DashboardSalesGranularity,
  DashboardSalesResponse,
  DashboardTopProduct,
  DashboardTopProductsResponse,
  DashboardWelcomeResponse,
} from "@/features/analytics/analytics.types";
import type { SalesStatus } from "@/features/sales/sales.types";

type OrderRow = {
  id: string;
  total_cents: number;
  created_at: string;
  order_number?: string;
  status?: SalesStatus;
  sales_channel?: string;
};

type NamedRelation = {
  name: string | null;
};

type OrderItemRow = {
  order_id: string;
  product_id: string;
  variant_id: string | null;
  item_name: string;
  sku: string;
  quantity: number | string;
  line_total_cents: number;
  product: NamedRelation | NamedRelation[] | null;
  variant: NamedRelation | NamedRelation[] | null;
};

const VALID_ORDER_STATUSES: SalesStatus[] = ["paid", "fulfilled"];

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function buildPeriodBounds(year: number, month: number) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const nextMonthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));

  return {
    monthStart,
    nextMonthStart,
    monthEnd,
  };
}

function buildPreviousPeriod(year: number, month: number) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

function formatIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("es-EC", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function createDailySeries(year: number, month: number) {
  const { monthStart, monthEnd } = buildPeriodBounds(year, month);
  const series = [];

  for (let cursor = new Date(monthStart); cursor <= monthEnd; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const bucket = formatIsoDate(cursor);
    series.push({
      bucket,
      label: new Intl.DateTimeFormat("es-EC", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${bucket}T00:00:00Z`)),
      totalSalesCents: 0,
      orderCount: 0,
    });
  }

  return series;
}

function createWeeklySeries(year: number, month: number) {
  const { monthEnd } = buildPeriodBounds(year, month);
  const totalWeeks = Math.ceil(monthEnd.getUTCDate() / 7);

  return Array.from({ length: totalWeeks }, (_, index) => ({
    bucket: `${year}-${String(month).padStart(2, "0")}-W${index + 1}`,
    label: `Sem ${index + 1}`,
    totalSalesCents: 0,
    orderCount: 0,
  }));
}

function createMonthlySeries(year: number, activeMonth: number) {
  return Array.from({ length: 12 }, (_, index) => ({
    bucket: `${year}-${String(index + 1).padStart(2, "0")}`,
    label: formatMonthLabel(year, index + 1),
    totalSalesCents: 0,
    orderCount: 0,
    isCurrent: index + 1 === activeMonth,
  }));
}

function summarizeOrders(orders: OrderRow[]) {
  const totalSalesCents = orders.reduce((sum, order) => sum + order.total_cents, 0);
  const orderCount = orders.length;

  return {
    totalSalesCents,
    orderCount,
    averageTicketCents: orderCount > 0 ? Math.round(totalSalesCents / orderCount) : 0,
  };
}

async function loadPeriodOrders(
  adminClient: SupabaseClient,
  year: number,
  month: number,
  select = "id, total_cents, created_at",
) {
  const { monthStart, nextMonthStart } = buildPeriodBounds(year, month);

  const ordersResult = await adminClient
    .from("orders")
    .select(select)
    .in("status", VALID_ORDER_STATUSES)
    .gte("created_at", monthStart.toISOString())
    .lt("created_at", nextMonthStart.toISOString())
    .order("created_at", { ascending: true });

  if (ordersResult.error) {
    throw new Error(ordersResult.error.message ?? "No se pudieron cargar las ventas del periodo.");
  }

  return (ordersResult.data ?? []) as unknown as OrderRow[];
}

async function loadYearOrders(adminClient: SupabaseClient, year: number) {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

  const ordersResult = await adminClient
    .from("orders")
    .select("id, total_cents, created_at")
    .in("status", VALID_ORDER_STATUSES)
    .gte("created_at", yearStart.toISOString())
    .lt("created_at", nextYearStart.toISOString())
    .order("created_at", { ascending: true });

  if (ordersResult.error) {
    throw new Error(ordersResult.error.message ?? "No se pudieron cargar las ventas del anio.");
  }

  return (ordersResult.data ?? []) as unknown as OrderRow[];
}

function sortTopProducts(products: DashboardTopProduct[]) {
  return [...products].sort((left, right) => {
    if (right.quantitySold !== left.quantitySold) {
      return right.quantitySold - left.quantitySold;
    }

    if (right.revenueCents !== left.revenueCents) {
      return right.revenueCents - left.revenueCents;
    }

    return left.productName.localeCompare(right.productName, "es");
  });
}

async function buildTopProducts(adminClient: SupabaseClient, orderIds: string[], limit: number) {
  const topProductsMap = new Map<string, DashboardTopProduct>();

  if (orderIds.length === 0) {
    return [];
  }

  const itemsResult = await adminClient
    .from("order_items")
    .select("order_id, product_id, variant_id, item_name, sku, quantity, line_total_cents, product:products(name), variant:product_variants(name)")
    .in("order_id", orderIds);

  if (itemsResult.error) {
    throw new Error(itemsResult.error.message ?? "No se pudieron cargar los productos vendidos del periodo.");
  }

  const orderSeenByProduct = new Map<string, Set<string>>();

  for (const item of (itemsResult.data ?? []) as unknown as OrderItemRow[]) {
    const product = getSingleRelation(item.product);
    const variant = getSingleRelation(item.variant);
    const productKey = `${item.product_id}:${item.variant_id ?? "base"}`;
    const quantity = Number(item.quantity);
    const existing = topProductsMap.get(productKey);

    if (existing) {
      existing.quantitySold += quantity;
      existing.revenueCents += item.line_total_cents;
    } else {
      topProductsMap.set(productKey, {
        productId: item.product_id,
        variantId: item.variant_id,
        productName: product?.name ?? item.item_name,
        variantName: variant?.name ?? null,
        sku: item.sku,
        quantitySold: quantity,
        revenueCents: item.line_total_cents,
        orderCount: 0,
      });
    }

    const orderSet = orderSeenByProduct.get(productKey) ?? new Set<string>();
    orderSet.add(item.order_id);
    orderSeenByProduct.set(productKey, orderSet);
  }

  for (const [productKey, product] of Array.from(topProductsMap.entries())) {
    product.orderCount = orderSeenByProduct.get(productKey)?.size ?? 0;
  }

  return sortTopProducts(Array.from(topProductsMap.values())).slice(0, limit);
}

export async function loadDashboardWelcomeMetrics(
  adminClient: SupabaseClient,
  params: { year: number; month: number; userId: string; userEmail?: string | null },
): Promise<DashboardWelcomeResponse> {
  const { year, month, userId, userEmail } = params;
  const previousPeriod = buildPreviousPeriod(year, month);

  const [currentOrders, previousOrders, profileResult, businessResult] = await Promise.all([
    loadPeriodOrders(adminClient, year, month),
    loadPeriodOrders(adminClient, previousPeriod.year, previousPeriod.month),
    adminClient.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    adminClient.from("business_settings").select("name").maybeSingle(),
  ]);

  const currentSummary = summarizeOrders(currentOrders);
  const previousSummary = summarizeOrders(previousOrders);
  const fallbackUserName = userEmail?.split("@")[0] ?? "Equipo";
  const growthRate = previousSummary.totalSalesCents > 0
    ? Math.round(((currentSummary.totalSalesCents - previousSummary.totalSalesCents) / previousSummary.totalSalesCents) * 100)
    : currentSummary.totalSalesCents > 0
      ? 100
      : 0;
  const { monthStart, monthEnd } = buildPeriodBounds(year, month);

  return {
    period: {
      year,
      month,
      monthStart: formatIsoDate(monthStart),
      monthEnd: formatIsoDate(monthEnd),
    },
    userName: (((profileResult.data as { full_name: string | null } | null)?.full_name ?? fallbackUserName) || fallbackUserName).trim(),
    businessName: ((businessResult.data as { name: string } | null)?.name ?? null),
    totalSalesCents: currentSummary.totalSalesCents,
    orderCount: currentSummary.orderCount,
    averageTicketCents: currentSummary.averageTicketCents,
    growthRate,
    previousSalesCents: previousSummary.totalSalesCents,
  };
}

export async function loadDashboardSalesMetrics(
  adminClient: SupabaseClient,
  params: { year: number; month: number; granularity: DashboardSalesGranularity },
): Promise<DashboardSalesResponse> {
  const { year, month, granularity } = params;
  const orders = await loadPeriodOrders(adminClient, year, month);
  const summary = summarizeOrders(orders);
  let series: DashboardSalesResponse["series"] = [];

  if (granularity === "day") {
    const dailySeries = createDailySeries(year, month);
    const trendByDate = new Map(dailySeries.map((point) => [point.bucket, point]));

    for (const order of orders) {
      const key = order.created_at.slice(0, 10);
      const point = trendByDate.get(key);

      if (point) {
        point.totalSalesCents += order.total_cents;
        point.orderCount += 1;
      }
    }

    series = dailySeries;
  }

  if (granularity === "week") {
    const weeklySeries = createWeeklySeries(year, month);

    for (const order of orders) {
      const weekIndex = Math.ceil(new Date(order.created_at).getUTCDate() / 7) - 1;
      const point = weeklySeries[weekIndex];

      if (point) {
        point.totalSalesCents += order.total_cents;
        point.orderCount += 1;
      }
    }

    series = weeklySeries;
  }

  if (granularity === "month") {
    const yearlyOrders = await loadYearOrders(adminClient, year);
    const monthlySeries = createMonthlySeries(year, month);

    for (const order of yearlyOrders) {
      const monthIndex = new Date(order.created_at).getUTCMonth();
      const point = monthlySeries[monthIndex];

      if (point) {
        point.totalSalesCents += order.total_cents;
        point.orderCount += 1;
      }
    }

    series = monthlySeries;
  }

  const { monthStart, monthEnd } = buildPeriodBounds(year, month);

  return {
    period: {
      year,
      month,
      monthStart: formatIsoDate(monthStart),
      monthEnd: formatIsoDate(monthEnd),
    },
    granularity,
    summary,
    series,
  };
}

export async function loadDashboardLatestSalesMetrics(
  adminClient: SupabaseClient,
  params: { year: number; month: number; limit: number },
): Promise<DashboardLatestSalesResponse> {
  const { year, month, limit } = params;
  const { monthStart, nextMonthStart, monthEnd } = buildPeriodBounds(year, month);

  const ordersResult = await adminClient
    .from("orders")
    .select("id, order_number, total_cents, status, sales_channel, created_at")
    .in("status", VALID_ORDER_STATUSES)
    .gte("created_at", monthStart.toISOString())
    .lt("created_at", nextMonthStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ordersResult.error) {
    throw new Error(ordersResult.error.message ?? "No se pudieron cargar las ultimas ventas.");
  }

  const orders = (ordersResult.data ?? []) as unknown as Array<OrderRow & {
    order_number: string;
    status: SalesStatus;
    sales_channel: string;
  }>;
  const orderIds = orders.map((order) => order.id);
  const itemCounts = new Map<string, number>();

  if (orderIds.length > 0) {
    const itemsResult = await adminClient
      .from("order_items")
      .select("order_id")
      .in("order_id", orderIds);

    if (itemsResult.error) {
      throw new Error(itemsResult.error.message ?? "No se pudieron cargar los items de las ultimas ventas.");
    }

    for (const item of itemsResult.data ?? []) {
      const orderId = item.order_id as string;
      itemCounts.set(orderId, (itemCounts.get(orderId) ?? 0) + 1);
    }
  }

  const sales: DashboardLatestSaleItem[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    totalCents: order.total_cents,
    status: order.status,
    salesChannel: order.sales_channel,
    createdAt: order.created_at,
    itemCount: itemCounts.get(order.id) ?? 0,
  }));

  return {
    period: {
      year,
      month,
      monthStart: formatIsoDate(monthStart),
      monthEnd: formatIsoDate(monthEnd),
    },
    limit,
    sales,
  };
}

export async function loadDashboardTopProductsMetrics(
  adminClient: SupabaseClient,
  params: { year: number; month: number; limit: number },
): Promise<DashboardTopProductsResponse> {
  const { year, month, limit } = params;
  const { monthStart, monthEnd } = buildPeriodBounds(year, month);
  const orders = await loadPeriodOrders(adminClient, year, month);
  const topProducts = await buildTopProducts(adminClient, orders.map((order) => order.id), limit);

  return {
    period: {
      year,
      month,
      monthStart: formatIsoDate(monthStart),
      monthEnd: formatIsoDate(monthEnd),
    },
    limit,
    topProducts,
  };
}

export async function loadDashboardAnalytics(
  adminClient: SupabaseClient,
  params: { year: number; month: number; limit: number },
): Promise<DashboardAnalyticsResponse> {
  const salesMetrics = await loadDashboardSalesMetrics(adminClient, {
    year: params.year,
    month: params.month,
    granularity: "day",
  });
  const topProductsMetrics = await loadDashboardTopProductsMetrics(adminClient, params);

  return {
    period: salesMetrics.period,
    summary: salesMetrics.summary,
    trend: salesMetrics.series.map((point) => ({
      date: point.bucket,
      totalSalesCents: point.totalSalesCents,
      orderCount: point.orderCount,
    })),
    topProducts: topProductsMetrics.topProducts,
  };
}