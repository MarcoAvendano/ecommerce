"use client";

import { alpha, useTheme } from "@mui/material/styles";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { PeriodSelect, type PeriodSelectProps } from "@/features/analytics/components/PeriodSelect";
import { HorizontalBarChart } from "@/features/analytics/components/charts/HorizontalBarChart";
import type {
  DashboardAnalyticsPeriod,
  DashboardTopProduct,
} from "@/features/analytics/analytics.types";
import { formatSalesCurrency } from "@/features/sales/sales.formatters";
import { formatQuantity } from "@/features/suppliers/suppliers.formatters";

interface TopProductsChartCardProps {
  period: DashboardAnalyticsPeriod;
  products: DashboardTopProduct[];
  periodSelectProps: PeriodSelectProps;
}

function buildLabel(product: DashboardTopProduct) {
  return product.variantName ? `${product.productName} · ${product.variantName}` : product.productName;
}

export function TopProductsChartCard({
  period,
  products,
  periodSelectProps,
}: TopProductsChartCardProps) {
  const theme = useTheme();
  const categories = products.map((product) => buildLabel(product));
  const series = [
    {
      name: "Unidades vendidas",
      data: products.map((product) => Number(product.quantitySold)),
    },
  ];

  return (
    <DashboardCard
      title="Productos mas vendidos"
      subtitle="Ranking del periodo por unidades despachadas"
      action={<PeriodSelect {...periodSelectProps} />}
    >
      <>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} mb={2.5}>
          <Typography color="textSecondary" variant="body2">
            Productos clave para reabastecimiento y rotacion.
          </Typography>
          <Chip label={`${period.month}/${period.year}`} size="small" variant="outlined" />
        </Stack>
        {products.length === 0 ? (
          <Box py={8} textAlign="center">
            <Typography variant="h6" mb={1}>
              No hay productos vendidos en el periodo seleccionado
            </Typography>
            <Typography color="textSecondary" variant="body2">
              El ranking se habilitara en cuanto existan ventas confirmadas.
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: 3,
                background: `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
              }}
            >
              <HorizontalBarChart
                categories={categories}
                series={series}
                valueFormatter={(value) => formatQuantity(value)}
              />
            </Box>
            <Divider sx={{ my: 3 }} />
            <Stack spacing={2}>
              {products.map((product, index) => (
                <Stack
                  key={`${product.productId}-${product.variantId ?? "base"}`}
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(theme.palette.secondary.main, 0.12),
                        color: theme.palette.secondary.main,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {buildLabel(product)}
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        SKU {product.sku} · {formatQuantity(Number(product.quantitySold))} unidades · {product.orderCount} ordenes
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {formatSalesCurrency(product.revenueCents)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </>
        )}
      </>
    </DashboardCard>
  );
}