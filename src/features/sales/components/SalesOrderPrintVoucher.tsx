import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatSalesChannel, formatSalesDate, formatSalesPaymentMethod } from "@/features/sales/sales.formatters";
import { SalesOrderItemsTable } from "@/features/sales/components/SalesOrderItemsTable";
import { SalesOrderSummary } from "@/features/sales/components/SalesOrderSummary";
import type { SalesOrderDetail } from "@/features/sales/sales.types";

interface SalesOrderPrintVoucherProps {
  order: SalesOrderDetail;
  businessName: string;
  businessLogoUrl: string | null;
}

function formatAddressLines(order: SalesOrderDetail) {
  if (!order.shippingAddress) {
    return [];
  }

  return [
    order.shippingAddress.label,
    order.shippingAddress.line1,
    order.shippingAddress.line2,
    [order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(", "),
    [order.shippingAddress.postalCode, order.shippingAddress.country].filter(Boolean).join(" "),
  ].filter(Boolean) as string[];
}

export function SalesOrderPrintVoucher({
  order,
  businessName,
  businessLogoUrl,
}: SalesOrderPrintVoucherProps) {
  const shippingLines = formatAddressLines(order);

  return (
    <Box className="print-only sales-print-voucher">
      <Stack spacing={1.5}>
        <Stack spacing={1} alignItems="center" textAlign="center">
          {businessLogoUrl ? (
            <Box
              component="img"
              src={businessLogoUrl}
              alt={businessName}
              sx={{ maxWidth: 120, maxHeight: 64, objectFit: "contain" }}
            />
          ) : null}
          <Typography variant="h6" fontWeight={700}>
            {businessName}
          </Typography>
          <Typography variant="caption">Comprobante de compra</Typography>
        </Stack>

        <Divider />

        <Stack spacing={0.5}>
          <Typography variant="body2">Orden: {order.orderNumber}</Typography>
          <Typography variant="body2">Fecha: {formatSalesDate(order.createdAt)}</Typography>
          <Typography variant="body2">Canal: {formatSalesChannel(order.salesChannel)}</Typography>
          <Typography variant="body2">Pago: {formatSalesPaymentMethod(order.paymentMethod)}</Typography>
          <Typography variant="body2">
            Cliente: {order.customer?.fullName ?? "Consumidor final"}
          </Typography>
        </Stack>

        {shippingLines.length > 0 ? (
          <>
            <Divider />
            <Stack spacing={0.25}>
              <Typography variant="subtitle2">Envio</Typography>
              {shippingLines.map((line) => (
                <Typography key={line} variant="body2">
                  {line}
                </Typography>
              ))}
            </Stack>
          </>
        ) : null}

        <Divider />
        <SalesOrderItemsTable items={order.items} variant="print" />
        <Divider />
        <SalesOrderSummary
          subtotalCents={order.subtotalCents}
          discountCents={order.discountCents}
          taxCents={order.taxCents}
          totalCents={order.totalCents}
          compact
        />

        {order.notes ? (
          <>
            <Divider />
            <Typography variant="body2">Notas: {order.notes}</Typography>
          </>
        ) : null}

        <Divider />
        <Stack spacing={0.5} alignItems="center" textAlign="center">
          <Typography variant="body2">Gracias por su compra.</Typography>
          <Typography variant="caption">Conserve este comprobante para cualquier aclaracion.</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}