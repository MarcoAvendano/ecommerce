import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getDashboardAnalytics,
  getDashboardLatestSales,
  getDashboardSales,
  getDashboardTopProducts,
  getDashboardWelcome,
} from "@/features/analytics/analytics.api";
import type { DashboardAnalyticsParams, DashboardSalesParams } from "@/features/analytics/analytics.types";

export const dashboardAnalyticsQueryKey = (params: DashboardAnalyticsParams = {}) =>
  [
    "analytics",
    "dashboard",
    params.year ?? "current-year",
    params.month ?? "current-month",
    params.limit ?? "default-limit",
  ] as const;

export function useDashboardAnalyticsQuery(params: DashboardAnalyticsParams = {}) {
  return useQuery({
    queryKey: dashboardAnalyticsQueryKey(params),
    queryFn: () => getDashboardAnalytics(params),
    placeholderData: keepPreviousData,
  });
}

export const dashboardWelcomeQueryKey = (params: DashboardAnalyticsParams = {}) =>
  ["analytics", "welcome", params.year ?? "current-year", params.month ?? "current-month"] as const;

export const dashboardSalesQueryKey = (params: DashboardSalesParams = {}) =>
  [
    "analytics",
    "sales",
    params.year ?? "current-year",
    params.month ?? "current-month",
    params.granularity ?? "day",
  ] as const;

export const dashboardLatestSalesQueryKey = (params: DashboardAnalyticsParams = {}) =>
  [
    "analytics",
    "latest-sales",
    params.year ?? "current-year",
    params.month ?? "current-month",
    params.limit ?? 5,
  ] as const;

export const dashboardTopProductsQueryKey = (params: DashboardAnalyticsParams = {}) =>
  [
    "analytics",
    "top-products",
    params.year ?? "current-year",
    params.month ?? "current-month",
    params.limit ?? 5,
  ] as const;

export function useDashboardWelcomeQuery(params: DashboardAnalyticsParams = {}) {
  return useQuery({
    queryKey: dashboardWelcomeQueryKey(params),
    queryFn: () => getDashboardWelcome(params),
    placeholderData: keepPreviousData,
  });
}

export function useDashboardSalesQuery(params: DashboardSalesParams = {}) {
  return useQuery({
    queryKey: dashboardSalesQueryKey(params),
    queryFn: () => getDashboardSales(params),
    placeholderData: keepPreviousData,
  });
}

export function useDashboardLatestSalesQuery(params: DashboardAnalyticsParams = {}) {
  return useQuery({
    queryKey: dashboardLatestSalesQueryKey(params),
    queryFn: () => getDashboardLatestSales(params),
    placeholderData: keepPreviousData,
  });
}

export function useDashboardTopProductsQuery(params: DashboardAnalyticsParams = {}) {
  return useQuery({
    queryKey: dashboardTopProductsQueryKey(params),
    queryFn: () => getDashboardTopProducts(params),
    placeholderData: keepPreviousData,
  });
}