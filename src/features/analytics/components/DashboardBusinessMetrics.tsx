"use client";

import { Grid } from "@mui/material";
import { DashboardWelcomePanel } from "@/features/analytics/components/DashboardWelcomePanel";
import { LatestSalesCard } from "@/features/analytics/components/LatestSalesCard";
import { SalesPerformanceCard } from "@/features/analytics/components/SalesPerformanceCard";
import { TopProductsPanel } from "@/features/analytics/components/TopProductsPanel";

export function DashboardBusinessMetrics() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <DashboardWelcomePanel />
      </Grid>
      <Grid item xs={12} lg={8}>
        <SalesPerformanceCard />
      </Grid>
      <Grid item xs={12} lg={4}>
        <LatestSalesCard />
      </Grid>
      <Grid item xs={12}>
        <TopProductsPanel />
      </Grid>
    </Grid>
  );
}