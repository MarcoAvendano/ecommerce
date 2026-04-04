"use client";

import { alpha, useTheme } from "@mui/material/styles";
import { Box, Chip, Stack, Typography } from "@mui/material";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { PeriodSelect, type PeriodSelectProps } from "@/features/analytics/components/PeriodSelect";
import { AreaLineChart } from "@/features/analytics/components/charts/AreaLineChart";
import type {
  DashboardAnalyticsPeriod,
  DashboardSalesTrendPoint,
} from "@/features/analytics/analytics.types";
import { formatSalesCurrency } from "@/features/sales/sales.formatters";

interface SalesTrendChartCardProps {
  period: DashboardAnalyticsPeriod;
  trend: DashboardSalesTrendPoint[];
  periodSelectProps: PeriodSelectProps;
}

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function SalesTrendChartCard({ period, trend, periodSelectProps }: SalesTrendChartCardProps) {
  const theme = useTheme();
  const hasSales = trend.some((point) => point.totalSalesCents > 0);
  const categories = trend.map((point) => formatDayLabel(point.date));
  const peakValue = trend.reduce((currentMax, point) => Math.max(currentMax, point.totalSalesCents), 0);
  const series = [
    {
      name: "Ventas",
      data: trend.map((point) => point.totalSalesCents),
    },
  ];

  return (
    <DashboardCard
      title="Tendencia de ventas"
      subtitle="Comportamiento diario del periodo seleccionado"
      action={<PeriodSelect {...periodSelectProps} />}
    >
      <>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          mb={2.5}
        >
          <Box>
            <Typography color="textSecondary" variant="body2" mb={0.75}>
              Serie diaria para detectar aceleraciones, caidas y dias pico.
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`${period.month}/${period.year}`} size="small" variant="outlined" />
              <Chip
                label={`Pico ${formatSalesCurrency(peakValue)}`}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              />
            </Stack>
          </Box>
        </Stack>
        <Box
          sx={{
            p: { xs: 1.5, md: 2 },
            borderRadius: 3,
            background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          {hasSales ? (
            <AreaLineChart
              categories={categories}
              series={series}
              valueFormatter={(value) => formatSalesCurrency(value)}
            />
          ) : (
            <Box py={8} textAlign="center">
              <Typography variant="h6" mb={1}>
                Sin ventas registradas en este periodo
              </Typography>
              <Typography color="textSecondary" variant="body2">
                La tendencia aparecera automaticamente cuando existan ordenes pagadas o completadas.
              </Typography>
            </Box>
          )}
        </Box>
      </>
    </DashboardCard>
  );
}