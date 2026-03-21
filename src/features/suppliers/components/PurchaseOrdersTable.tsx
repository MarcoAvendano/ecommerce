"use client";

import { Chip, Stack, Typography } from "@mui/material";
import { IconEdit, IconEye, IconTruckDelivery } from "@tabler/icons-react";
import type { GridColDef, GridRenderCellParams, GridValueFormatterParams } from "@mui/x-data-grid";
import { AppDataGrid } from "@/app/components/shared/data-grid/AppDataGrid";
import { RowActionsMenu } from "@/features/catalog/components/RowActionsMenu";
import {
  formatPurchaseOrderStatusColor,
  formatPurchaseOrderStatusLabel,
  formatSupplierCurrency,
  formatSupplierDate,
} from "@/features/suppliers/suppliers.formatters";
import type { PurchaseOrderListItem } from "@/features/suppliers/suppliers.types";

interface PurchaseOrdersTableProps {
  orders: PurchaseOrderListItem[];
  onEdit: (order: PurchaseOrderListItem) => void;
  onReceive: (order: PurchaseOrderListItem) => void;
  onView: (order: PurchaseOrderListItem) => void;
}

function isEditable(status: PurchaseOrderListItem["status"]) {
  return status === "draft" || status === "sent";
}

function canReceive(status: PurchaseOrderListItem["status"]) {
  return status === "draft" || status === "sent" || status === "partial";
}

function getColumns(
  onEdit: (order: PurchaseOrderListItem) => void,
  onReceive: (order: PurchaseOrderListItem) => void,
  onView: (order: PurchaseOrderListItem) => void,
): GridColDef<PurchaseOrderListItem>[] {
  return [
    {
      field: "orderNumber",
      headerName: "Orden",
      minWidth: 136,
      flex: 1,
      renderCell: (params: GridRenderCellParams<PurchaseOrderListItem>) => (
        <Stack justifyContent="center" sx={{ height: "100%", minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>{params.row.orderNumber}</Typography>
          <Typography variant="body2" color="textSecondary" noWrap>{params.row.itemCount} linea(s)</Typography>
        </Stack>
      ),
    },
    {
      field: "status",
      headerName: "Estado",
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<PurchaseOrderListItem>) => (
        <Chip size="small" label={formatPurchaseOrderStatusLabel(params.row.status)} color={formatPurchaseOrderStatusColor(params.row.status)} />
      ),
    },
    {
      field: "orderedAt",
      headerName: "Ordenada",
      minWidth: 118,
      valueFormatter: (params: GridValueFormatterParams<string>) => formatSupplierDate(params.value),
    },
    {
      field: "expectedAt",
      headerName: "Esperada",
      minWidth: 118,
      valueFormatter: (params: GridValueFormatterParams<string | null>) => formatSupplierDate(params.value),
    },
    {
      field: "totalCents",
      headerName: "Total",
      minWidth: 112,
      valueFormatter: (params: GridValueFormatterParams<number>) => formatSupplierCurrency(params.value),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 84,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<PurchaseOrderListItem>) => (
        <RowActionsMenu
          tooltip="Acciones de la orden"
          actions={[
            ...(params.row.status === "received"
              ? [{ id: "view-order", label: "Ver orden", icon: <IconEye size={18} />, onClick: () => onView(params.row) }]
              : []),
            ...(isEditable(params.row.status)
              ? [{ id: "edit-order", label: "Editar orden", icon: <IconEdit size={18} />, onClick: () => onEdit(params.row) }]
              : []),
            ...(canReceive(params.row.status)
              ? [{ id: "receive-order", label: "Registrar ingreso", icon: <IconTruckDelivery size={18} />, onClick: () => onReceive(params.row) }]
              : []),
          ]}
        />
      ),
    },
  ];
}

export function PurchaseOrdersTable({ orders, onEdit, onReceive, onView }: PurchaseOrdersTableProps) {
  return (
    <AppDataGrid
      rows={orders}
      columns={getColumns(onEdit, onReceive, onView)}
      searchPlaceholder="Buscar por numero o estado"
      searchValueExtractor={(order) => [order.orderNumber, order.status, order.notes ?? ""].join(" ")}
      emptyMessage="No hay ordenes de compra para este proveedor."
      initialPageSize={5}
      pageSizeOptions={[5, 10, 25]}
    />
  );
}
