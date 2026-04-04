"use client";

import { alpha, useTheme } from "@mui/material/styles";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import DashboardCard from "@/app/components/shared/DashboardCard";
import type {
  DashboardAnalyticsPeriod,
  DashboardAnalyticsSummary,
} from "@/features/analytics/analytics.types";
import { PeriodSelect, type PeriodSelectProps } from "@/features/analytics/components/PeriodSelect";
import { formatSalesCurrency } from "@/features/sales/sales.formatters";

interface MonthlySalesSummaryCardProps {
  period: DashboardAnalyticsPeriod;
  summary: DashboardAnalyticsSummary;
  periodSelectProps: PeriodSelectProps;
}

function formatPeriodLabel(period: DashboardAnalyticsPeriod) {
  return new Intl.DateTimeFormat("es-EC", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${period.monthStart}T00:00:00Z`));
}

export function MonthlySalesSummaryCard({
  period,
  summary,
  periodSelectProps,
}: MonthlySalesSummaryCardProps) {
  const theme = useTheme();
  const periodLabel = formatPeriodLabel(period);

  return (
    <DashboardCard
      title="Ventas del periodo"
      subtitle="Resumen ejecutivo del mes seleccionado"
      action={<PeriodSelect {...periodSelectProps} />}
    >
      <>
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.primary.light, 0.06)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            mb: 3,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} mb={1.5}>
            <Box>
              <Typography variant="overline" color="textSecondary">
                Ingreso acumulado
              </Typography>
              <Typography variant="h3" sx={{ mt: 0.5 }}>
                {formatSalesCurrency(summary.totalSalesCents)}
              </Typography>
            </Box>
            <Chip color="primary" label={periodLabel} size="small" />
          </Stack>
          <Typography color="textSecondary" variant="body2">
            Vista ejecutiva lista para seguimiento comercial y cierre mensual.
          </Typography>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.08) }}>
            <Typography color="textSecondary" variant="body2" mb={0.75}>
              Ordenes cerradas
            </Typography>
            <Typography variant="h5">{summary.orderCount.toLocaleString("es-EC")}</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.08) }}>
            <Typography color="textSecondary" variant="body2" mb={0.75}>
              Ticket promedio
            </Typography>
            <Typography variant="h5">{formatSalesCurrency(summary.averageTicketCents)}</Typography>
          </Box>
        </Stack>
      </>
    </DashboardCard>
  );
}