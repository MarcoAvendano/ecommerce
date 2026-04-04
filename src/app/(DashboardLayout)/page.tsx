"use client";
import Box from "@mui/material/Box";

import PageContainer from "@/app/components/container/PageContainer";
import { DashboardBusinessMetrics } from "@/features/analytics/components/DashboardBusinessMetrics";

export default function Dashboard() {
  return (
    <PageContainer
      title="Dashboard ejecutivo"
      description="Metricas clave del negocio para toma de decisiones"
    >
      <Box mt={3}>
        <DashboardBusinessMetrics />

        {/*
        Dashboard anterior temporalmente comentado durante la refactorizacion.

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <WelcomeCard />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Expence isLoading={isLoading} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Sales isLoading={isLoading} />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <RevenueUpdates isLoading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <SalesOverview isLoading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <SalesTwo isLoading={isLoading} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Growth isLoading={isLoading} />
              </Grid>
              <Grid item xs={12}>
                <MonthlyEarnings isLoading={isLoading} />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <WeeklyStats isLoading={isLoading} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <YearlySales isLoading={isLoading} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <PaymentGateways />
          </Grid>
          <Grid item xs={12} lg={4}>
            <RecentTransactions />
          </Grid>
          <Grid item xs={12} lg={8}>
            <ProductPerformances />
          </Grid>
        </Grid>
        */}
      </Box>
    </PageContainer>
  );
}
