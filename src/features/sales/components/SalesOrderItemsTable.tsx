import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { formatSalesCurrency } from "@/features/sales/sales.formatters";
import type { SalesOrderDetailItem } from "@/features/sales/sales.types";

interface SalesOrderItemsTableProps {
  items: SalesOrderDetailItem[];
  variant?: "default" | "print";
}

export function SalesOrderItemsTable({ items, variant = "default" }: SalesOrderItemsTableProps) {
  const compact = variant === "print";

  if (compact) {
    return (
      <Table size="small" className="sales-print-table" aria-label="Detalle de productos del voucher">
        <colgroup>
          <col style={{ width: "46%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell className="sales-print-description">Descripcion</TableCell>
            <TableCell align="right" className="sales-print-number">Cantidad</TableCell>
            <TableCell align="right" className="sales-print-number">Pre.Uni</TableCell>
            <TableCell align="right" className="sales-print-number">Pre.Tot</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="sales-print-description">
                <Stack spacing={0.2}>
                  <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.25, wordBreak: "break-word" }}>
                    {item.variantName}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="center" className="sales-print-number">
                {item.quantity}
              </TableCell>
              <TableCell align="center" className="sales-print-number">
                {formatSalesCurrency(item.unitPriceCents)}
              </TableCell>
              <TableCell align="center" className="sales-print-number">
                {formatSalesCurrency(item.subtotalCents)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size={compact ? "small" : "medium"}>
        <TableHead>
          <TableRow>
            <TableCell>Producto</TableCell>
            <TableCell>Variante</TableCell>
            <TableCell align="right">Cant.</TableCell>
            <TableCell align="right">P. unit.</TableCell>
            <TableCell align="right">Desc.</TableCell>
            <TableCell align="right">Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Stack spacing={0.5}>
                  <Typography variant={compact ? "body2" : "subtitle2"}>{item.productName}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    SKU: {item.sku}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>{item.variantName ?? "No aplica"}</TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell align="right">{formatSalesCurrency(item.unitPriceCents)}</TableCell>
              <TableCell align="right">-{formatSalesCurrency(item.discountCents)}</TableCell>
              <TableCell align="right">{formatSalesCurrency(item.subtotalCents)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}