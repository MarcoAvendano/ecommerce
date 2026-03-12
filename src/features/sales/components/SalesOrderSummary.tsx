import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { formatSalesCurrency } from "@/features/sales/sales.formatters";

interface SalesOrderSummaryProps {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  compact?: boolean;
}

export function SalesOrderSummary({
  subtotalCents,
  discountCents,
  taxCents,
  totalCents,
  compact = false,
}: SalesOrderSummaryProps) {
  return (
    <Stack spacing={compact ? 0.75 : 1.25}>
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography color="textSecondary">Subtotal</Typography>
        <Typography>{formatSalesCurrency(subtotalCents)}</Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography color="textSecondary">Descuentos</Typography>
        <Typography color={discountCents > 0 ? "error.main" : "text.primary"}>
          -{formatSalesCurrency(discountCents)}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography color="textSecondary">Impuestos</Typography>
        <Typography>{formatSalesCurrency(taxCents)}</Typography>
      </Stack>
      <Divider />
      <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
        <Typography variant={compact ? "subtitle1" : "h6"}>Total final</Typography>
        <Typography variant={compact ? "subtitle1" : "h5"} fontWeight={700}>
          {formatSalesCurrency(totalCents)}
        </Typography>
      </Stack>
    </Stack>
  );
}