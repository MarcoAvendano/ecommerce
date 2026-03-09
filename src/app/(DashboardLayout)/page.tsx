"use client";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { useEffect, useState } from "react";

import PageContainer from "@/app/components/container/PageContainer";
// components
import MonthlyEarnings from "@/app/components/dashboards/modern/MonthlyEarnings";
import RevenueUpdates from "@/app/components/dashboards/modern/RevenueUpdates";
import WeeklyStats from "@/app/components/dashboards/modern/WeeklyStats";
import WelcomeCard from "../components/dashboards/ecommerce/WelcomeCard";
import Expence from "../components/dashboards/ecommerce/Expence";
import Sales from "../components/dashboards/ecommerce/Sales";
import SalesOverview from "../components/dashboards/ecommerce/SalesOverview";
import SalesTwo from "../components/dashboards/ecommerce/SalesTwo";
import Growth from "../components/dashboards/ecommerce/Growth";
import YearlySales from "../components/dashboards/ecommerce/YearlySales";
import PaymentGateways from "../components/dashboards/ecommerce/PaymentGateways";
import RecentTransactions from "../components/dashboards/ecommerce/RecentTransactions";
import ProductPerformances from "../components/dashboards/ecommerce/ProductPerformances";

export default function Dashboard() {
  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <PageContainer title="eCommerce Dashboard" description="this is eCommerce Dashboard">
      <Box mt={3}>
        <Grid container spacing={3}>
          {/* column */}
          <Grid item xs={12} lg={8}>
            <WelcomeCard />
          </Grid>

          {/* column */}
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
          {/* column */}
          <Grid item xs={12} sm={6} lg={4}>
            <WeeklyStats isLoading={isLoading} />
          </Grid>
          {/* column */}
          <Grid item xs={12} lg={4}>
            <YearlySales isLoading={isLoading} />
          </Grid>
          {/* column */}
          <Grid item xs={12} lg={4}>
            <PaymentGateways />
          </Grid>
          {/* column */}

          <Grid item xs={12} lg={4}>
            <RecentTransactions />
          </Grid>
          {/* column */}

          <Grid item xs={12} lg={8}>
            <ProductPerformances />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
