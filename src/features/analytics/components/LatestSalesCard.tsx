"use client";

import React from "react";
import { Alert, Box, Button, Chip, Divider, Skeleton, Stack, Typography } from "@mui/material";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { useDashboardLatestSalesQuery } from "@/features/analytics/analytics.queries";
import { PeriodSelect, type PeriodSelectProps } from "@/features/analytics/components/PeriodSelect";
import { useDashboardPeriod } from "@/features/analytics/useDashboardPeriod";
import {
  formatSalesChannel,
  formatSalesCurrency,
  formatSalesDate,
  formatSalesStatusColor,
  formatSalesStatusLabel,
} from "@/features/sales/sales.formatters";

function LatestSalesLoadingCard() {
  return (
    <DashboardCard>
      <>
        <Skeleton variant="text" width="45%" height={36} />
        <Skeleton variant="text" width="70%" />
        <Stack spacing={2} mt={3}>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={56} />
          ))}
        </Stack>
      </>
    </DashboardCard>
  );
}

export function LatestSalesCard() {
  const { month, year, monthOptions, yearOptions, handleMonthChange, handleYearChange } = useDashboardPeriod();

  const periodSelectProps: PeriodSelectProps = {
    idPrefix: "latest-sales",
    month,
    year,
    monthOptions,
    yearOptions,
    onMonthChange: handleMonthChange,
    onYearChange: handleYearChange,
  };

  const { data, isLoading, isError, error, refetch } = useDashboardLatestSalesQuery({ year, month, limit: 5 });

  if (isLoading) {
    return <LatestSalesLoadingCard />;
  }

  if (isError || !data) {
    return (
      <DashboardCard title="Ultimas ventas" subtitle="No se pudieron cargar las ventas recientes" action={<PeriodSelect {...periodSelectProps} />}>
        <>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          >
            {error instanceof Error ? error.message : "Ocurrio un error al cargar las ventas recientes."}
          </Alert>
        </>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Ultimas ventas" subtitle="Las 5 ordenes mas recientes del periodo" action={<PeriodSelect {...periodSelectProps} />}>
      <>
        {data.sales.length === 0 ? (
          <Box py={8} textAlign="center">
            <Typography variant="h6" mb={1}>
              No hay ventas recientes en este periodo
            </Typography>
            <Typography color="textSecondary" variant="body2">
              Ajusta el mes o el anio para revisar otra ventana de tiempo.
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {data.sales.map((sale) => (
              <Box key={sale.id} py={1.75}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {sale.orderNumber}
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      {formatSalesDate(sale.createdAt)} · {formatSalesChannel(sale.salesChannel)} · {sale.itemCount} items
                    </Typography>
                  </Box>
                  <Stack spacing={1} alignItems="flex-end">
                    <Typography variant="subtitle1" fontWeight={700}>
                      {formatSalesCurrency(sale.totalCents)}
                    </Typography>
                    <Chip
                      label={formatSalesStatusLabel(sale.status)}
                      size="small"
                      color={formatSalesStatusColor(sale.status)}
                    />
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </>
    </DashboardCard>
  );
}