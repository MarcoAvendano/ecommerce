"use client";

import React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Chip, Grid, Skeleton, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { formatSelectedPeriod } from "@/features/analytics/analytics.filters";
import { useDashboardSalesQuery } from "@/features/analytics/analytics.queries";
import { PeriodSelect, type PeriodSelectProps } from "@/features/analytics/components/PeriodSelect";
import { AreaLineChart } from "@/features/analytics/components/charts/AreaLineChart";
import type { DashboardSalesGranularity } from "@/features/analytics/analytics.types";
import { useDashboardPeriod } from "@/features/analytics/useDashboardPeriod";
import { formatSalesCurrency } from "@/features/sales/sales.formatters";

const granularityOptions: Array<{ value: DashboardSalesGranularity; label: string }> = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

function SalesLoadingCard() {
  return (
    <DashboardCard>
      <>
        <Skeleton variant="text" width="35%" height={36} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rounded" height={260} sx={{ mt: 3 }} />
      </>
    </DashboardCard>
  );
}

export function SalesPerformanceCard() {
  const theme = useTheme();
  const { month, year, monthOptions, yearOptions, handleMonthChange, handleYearChange } = useDashboardPeriod();
  const [granularity, setGranularity] = React.useState<DashboardSalesGranularity>("day");

  const periodSelectProps: PeriodSelectProps = {
    idPrefix: "sales-performance",
    month,
    year,
    granularity,
    granularityOptions,
    monthOptions,
    yearOptions,
    onMonthChange: handleMonthChange,
    onYearChange: handleYearChange,
    onGranularityChange: (event: SelectChangeEvent<unknown>) => setGranularity(event.target.value as DashboardSalesGranularity),
  };

  const { data, isLoading, isError, error, refetch } = useDashboardSalesQuery({ year, month, granularity });

  if (isLoading) {
    return <SalesLoadingCard />;
  }

  if (isError || !data) {
    return (
      <DashboardCard title="Ventas no disponibles" subtitle="No se pudo cargar la evolucion de ventas" action={<PeriodSelect {...periodSelectProps} />}>
        <>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          >
            {error instanceof Error ? error.message : "Ocurrio un error al cargar las ventas."}
          </Alert>
        </>
      </DashboardCard>
    );
  }

  const categories = data.series.map((point) => point.label);
  const values = data.series.map((point) => point.totalSalesCents);
  const hasSales = data.summary.totalSalesCents > 0;

  return (
    <DashboardCard
      title="Ventas"
      subtitle="Analiza el comportamiento por dia, semana o mes"
      action={<PeriodSelect {...periodSelectProps} />}
    >
      <>
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            mb: 3,
          }}
        >
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={8}>
              <Typography variant="overline" color="textSecondary">
                Periodo consultado
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5 }}>
                {formatSalesCurrency(data.summary.totalSalesCents)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {formatSelectedPeriod(data.period.year, data.period.month)}
              </Typography>
            </Grid>
            <Grid item xs={12} md="auto">
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip label={`Vista ${granularityOptions.find((item) => item.value === data.granularity)?.label ?? "Dia"}`} size="small" color="primary" />
                <Chip label={`${data.summary.orderCount} ordenes`} size="small" variant="outlined" />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {hasSales ? (
          <Box
            sx={{
              p: { xs: 1.5, md: 2 },
              borderRadius: 3,
              background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <AreaLineChart
              categories={categories}
              series={[{ name: "Ventas", data: values }]}
              valueFormatter={(value) => formatSalesCurrency(value)}
              height={310}
            />
          </Box>
        ) : (
          <Box py={8} textAlign="center">
            <Typography variant="h6" mb={1}>
              Sin ventas registradas en este periodo
            </Typography>
            <Typography color="textSecondary" variant="body2">
              Cambia el mes, el anio o la granularidad para revisar otro comportamiento.
            </Typography>
          </Box>
        )}

        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.08) }}>
              <Typography color="textSecondary" variant="body2" mb={0.75}>
                Ordenes cerradas
              </Typography>
              <Typography variant="h5">{data.summary.orderCount.toLocaleString("es-EC")}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.08) }}>
              <Typography color="textSecondary" variant="body2" mb={0.75}>
                Ticket promedio
              </Typography>
              <Typography variant="h5">{formatSalesCurrency(data.summary.averageTicketCents)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </>
    </DashboardCard>
  );
}