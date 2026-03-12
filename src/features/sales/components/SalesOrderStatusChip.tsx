import Chip from "@mui/material/Chip";
import { formatSalesStatusColor, formatSalesStatusLabel } from "@/features/sales/sales.formatters";
import type { SalesStatus } from "@/features/sales/sales.types";

interface SalesOrderStatusChipProps {
  status: SalesStatus;
}

export function SalesOrderStatusChip({ status }: SalesOrderStatusChipProps) {
  return <Chip label={formatSalesStatusLabel(status)} color={formatSalesStatusColor(status)} size="small" />;
}