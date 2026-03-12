"use client";

import { Alert, Box, Button, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { IconArrowLeft, IconPrinter } from "@tabler/icons-react";
import BlankCard from "@/app/components/shared/BlankCard";
import { SalesOrderItemsTable } from "@/features/sales/components/SalesOrderItemsTable";
import { SalesOrderPrintVoucher } from "@/features/sales/components/SalesOrderPrintVoucher";
import { SalesOrderStatusChip } from "@/features/sales/components/SalesOrderStatusChip";
import { SalesOrderSummary } from "@/features/sales/components/SalesOrderSummary";
import {
  formatSalesChannel,
  formatSalesDate,
  formatSalesPaymentMethod,
} from "@/features/sales/sales.formatters";
import { useSalesOrderDetailQuery } from "@/features/sales/sales.queries";
import { useBusinessQuery } from "@/features/settings/settings.queries";

interface SalesOrderDetailPageClientProps {
  orderId: string;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Stack>
  );
}

function formatShippingAddress(orderAddress: {
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
}) {
  return [
    orderAddress.label,
    orderAddress.line1,
    orderAddress.line2,
    [orderAddress.city, orderAddress.state].filter(Boolean).join(", "),
    [orderAddress.postalCode, orderAddress.country].filter(Boolean).join(" "),
  ].filter(Boolean);
}

export function SalesOrderDetailPageClient({ orderId }: SalesOrderDetailPageClientProps) {
  const orderQuery = useSalesOrderDetailQuery(orderId);
  const businessQuery = useBusinessQuery();

  if (orderQuery.isLoading) {
    return (
      <Stack alignItems="center" py={8} spacing={2}>
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">
          Cargando detalle de la orden...
        </Typography>
      </Stack>
    );
  }

  if (orderQuery.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => orderQuery.refetch()}>
            Reintentar
          </Button>
        }
      >
        {orderQuery.error.message}
      </Alert>
    );
  }

  const order = orderQuery.data?.order;

  if (!order) {
    return <Alert severity="error">No se encontro la orden solicitada.</Alert>;
  }

  const shippingLines = order.shippingAddress ? formatShippingAddress(order.shippingAddress) : [];
  const businessName = businessQuery.data?.business?.name ?? "Negocio";
  const businessLogoUrl = businessQuery.data?.business?.logo_url ?? null;

  return (
    <>
      <Stack spacing={3} className="screen-only">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Orden {order.orderNumber}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Detalle completo de la venta registrada.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button component={Link} href="/apps/sales/list" variant="outlined" startIcon={<IconArrowLeft size={18} />}>
              Volver
            </Button>
            <Button variant="contained" startIcon={<IconPrinter size={18} />} onClick={() => window.print()}>
              Imprimir
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              <BlankCard>
                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack spacing={3}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
                      <Box>
                        <Typography variant="h6">Informacion general</Typography>
                        <Typography variant="body2" color="textSecondary">
                          Datos principales de la orden registrada.
                        </Typography>
                      </Box>
                      <SalesOrderStatusChip status={order.status} />
                    </Stack>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6} md={4}>
                        <DetailRow label="Numero de orden" value={order.orderNumber} />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <DetailRow label="Fecha" value={formatSalesDate(order.createdAt)} />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <DetailRow label="Canal" value={formatSalesChannel(order.salesChannel)} />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <DetailRow label="Cliente" value={order.customer?.fullName ?? "Consumidor final"} />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <DetailRow label="Metodo de pago" value={formatSalesPaymentMethod(order.paymentMethod)} />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <DetailRow label="Moneda" value={order.currency === "'USD'::text" ? "USD" : order.currency} />
                      </Grid>
                    </Grid>
                  </Stack>
                </Box>
              </BlankCard>

              <BlankCard>
                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="h6">Productos vendidos</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Desglose de productos, variantes, cantidades y valores de la venta.
                      </Typography>
                    </Box>
                    <SalesOrderItemsTable items={order.items} />
                  </Stack>
                </Box>
              </BlankCard>

              {order.notes ? (
                <BlankCard>
                  <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack spacing={1}>
                      <Typography variant="h6">Notas</Typography>
                      <Typography variant="body2">{order.notes}</Typography>
                    </Stack>
                  </Box>
                </BlankCard>
              ) : null}
            </Stack>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              <BlankCard>
                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6">Resumen de la venta</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Totales consolidados de la orden.
                      </Typography>
                    </Box>
                    <SalesOrderSummary
                      subtotalCents={order.subtotalCents}
                      discountCents={order.discountCents}
                      taxCents={order.taxCents}
                      totalCents={order.totalCents}
                    />
                  </Stack>
                </Box>
              </BlankCard>

              <BlankCard>
                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6">Cliente y entrega</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Datos del comprador y direccion de envio si aplica.
                      </Typography>
                    </Box>
                    <DetailRow label="Cliente" value={order.customer?.fullName ?? "Consumidor final"} />
                    {order.customer?.email ? <DetailRow label="Correo" value={order.customer.email} /> : null}
                    {order.customer?.phone ? <DetailRow label="Telefono" value={order.customer.phone} /> : null}
                    {shippingLines.length > 0 ? (
                      <Stack spacing={0.75}>
                        <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                          Direccion de envio
                        </Typography>
                        {shippingLines.map((line) => (
                          <Typography key={line} variant="body2">
                            {line}
                          </Typography>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        La orden no registra direccion de envio.
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </BlankCard>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <SalesOrderPrintVoucher
        order={order}
        businessName={businessName}
        businessLogoUrl={businessLogoUrl}
      />
    </>
  );
}