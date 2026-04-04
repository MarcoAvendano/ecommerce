"use client";

import React from "react";
import { Alert, Button } from "@mui/material";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { useDashboardTopProductsQuery } from "@/features/analytics/analytics.queries";
import { PeriodSelect, type PeriodSelectProps } from "@/features/analytics/components/PeriodSelect";
import { TopProductsChartCard } from "@/features/analytics/components/TopProductsChartCard";
import { useDashboardPeriod } from "@/features/analytics/useDashboardPeriod";

export function TopProductsPanel() {
  const { month, year, monthOptions, yearOptions, handleMonthChange, handleYearChange } = useDashboardPeriod();

  const periodSelectProps: PeriodSelectProps = {
    idPrefix: "top-products",
    month,
    year,
    monthOptions,
    yearOptions,
    onMonthChange: handleMonthChange,
    onYearChange: handleYearChange,
  };

  const { data, isLoading, isError, error, refetch } = useDashboardTopProductsQuery({ year, month, limit: 5 });

  if (isLoading) {
    return (
      <DashboardCard title="Productos mas vendidos" subtitle="Cargando rendimiento del periodo" action={<PeriodSelect {...periodSelectProps} />}>
        <></>
      </DashboardCard>
    );
  }

  if (isError || !data) {
    return (
      <DashboardCard title="Productos mas vendidos" subtitle="No se pudo cargar el ranking del periodo" action={<PeriodSelect {...periodSelectProps} />}>
        <>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          >
            {error instanceof Error ? error.message : "Ocurrio un error al cargar los productos destacados."}
          </Alert>
        </>
      </DashboardCard>
    );
  }

  return (
    <TopProductsChartCard
      period={data.period}
      products={data.topProducts}
      periodSelectProps={periodSelectProps}
    />
  );
}