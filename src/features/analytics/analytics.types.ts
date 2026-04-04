import type { SalesStatus } from "@/features/sales/sales.types";

export interface DashboardAnalyticsPeriod {
  year: number;
  month: number;
  monthStart: string;
  monthEnd: string;
}

export type DashboardSalesGranularity = "day" | "week" | "month";

export interface DashboardAnalyticsSummary {
  totalSalesCents: number;
  orderCount: number;
  averageTicketCents: number;
}

export interface DashboardSalesTrendPoint {
  date: string;
  totalSalesCents: number;
  orderCount: number;
}

export interface DashboardTopProduct {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string;
  quantitySold: number;
  revenueCents: number;
  orderCount: number;
}

export interface DashboardWelcomeResponse {
  period: DashboardAnalyticsPeriod;
  userName: string;
  businessName: string | null;
  totalSalesCents: number;
  orderCount: number;
  averageTicketCents: number;
  growthRate: number;
  previousSalesCents: number;
}

export interface DashboardSalesSeriesPoint {
  bucket: string;
  label: string;
  totalSalesCents: number;
  orderCount: number;
  isCurrent?: boolean;
}

export interface DashboardSalesResponse {
  period: DashboardAnalyticsPeriod;
  granularity: DashboardSalesGranularity;
  summary: DashboardAnalyticsSummary;
  series: DashboardSalesSeriesPoint[];
}

export interface DashboardLatestSaleItem {
  id: string;
  orderNumber: string;
  totalCents: number;
  status: SalesStatus;
  salesChannel: string;
  createdAt: string;
  itemCount: number;
}

export interface DashboardLatestSalesResponse {
  period: DashboardAnalyticsPeriod;
  limit: number;
  sales: DashboardLatestSaleItem[];
}

export interface DashboardTopProductsResponse {
  period: DashboardAnalyticsPeriod;
  limit: number;
  topProducts: DashboardTopProduct[];
}

export interface DashboardAnalyticsResponse {
  period: DashboardAnalyticsPeriod;
  summary: DashboardAnalyticsSummary;
  trend: DashboardSalesTrendPoint[];
  topProducts: DashboardTopProduct[];
}

export interface DashboardAnalyticsParams {
  year?: number;
  month?: number;
  limit?: number;
}

export interface DashboardSalesParams extends DashboardAnalyticsParams {
  granularity?: DashboardSalesGranularity;
}