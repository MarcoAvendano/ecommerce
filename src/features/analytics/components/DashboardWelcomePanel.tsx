"use client";

import React from "react";
import { Alert, Button, Skeleton } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import WelcomeCard from "@/app/components/dashboards/ecommerce/WelcomeCard";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { formatSelectedPeriod } from "@/features/analytics/analytics.filters";
import { useDashboardWelcomeQuery } from "@/features/analytics/analytics.queries";
import { PeriodSelect, type PeriodSelectProps } from "@/features/analytics/components/PeriodSelect";
import { useDashboardPeriod } from "@/features/analytics/useDashboardPeriod";
import { formatSalesCurrency } from "@/features/sales/sales.formatters";

function WelcomeLoadingCard() {
  return (
    <DashboardCard>
      <>
        <Skeleton variant="text" width="35%" height={36} />
        <Skeleton variant="text" width="55%" />
        <Skeleton variant="rounded" height={180} sx={{ mt: 3 }} />
      </>
    </DashboardCard>
  );
}

export function DashboardWelcomePanel() {
  const { month, year, monthOptions, yearOptions, handleMonthChange, handleYearChange } = useDashboardPeriod();

  const periodSelectProps: PeriodSelectProps = {
    idPrefix: "welcome-panel",
    month,
    year,
    monthOptions,
    yearOptions,
    onMonthChange: handleMonthChange,
    onYearChange: handleYearChange,
  };

  const { data, isLoading, isError, error, refetch } = useDashboardWelcomeQuery({ year, month });

  if (isLoading) {
    return <WelcomeLoadingCard />;
  }

  if (isError || !data) {
    return (
      <DashboardCard title="Bienvenida no disponible" subtitle="No se pudo cargar el resumen inicial" action={<PeriodSelect {...periodSelectProps} />}>
        <>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          >
            {error instanceof Error ? error.message : "Ocurrio un error al cargar el resumen de bienvenida."}
          </Alert>
        </>
      </DashboardCard>
    );
  }

  return (
    <WelcomeCard
      userName={data.userName}
      businessName={data.businessName}
      periodLabel={formatSelectedPeriod(data.period.year, data.period.month)}
      totalSalesLabel={formatSalesCurrency(data.totalSalesCents)}
      orderCountLabel={data.orderCount.toLocaleString("es-EC")}
      averageTicketLabel={formatSalesCurrency(data.averageTicketCents)}
      growthRate={data.growthRate}
      periodControl={<PeriodSelect {...periodSelectProps} />}
    />
  );
}