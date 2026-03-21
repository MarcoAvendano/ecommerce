"use client";

import { Chip, Stack, Typography } from "@mui/material";
import type { GridColDef, GridRenderCellParams, GridValueFormatterParams } from "@mui/x-data-grid";
import { AppDataGrid } from "@/app/components/shared/data-grid/AppDataGrid";
import {
  formatMovementTypeLabel,
  formatQuantity,
  formatSupplierCurrency,
  formatSupplierDate,
} from "@/features/suppliers/suppliers.formatters";
import type { InventoryMovementHistoryItem } from "@/features/suppliers/suppliers.types";

interface InventoryMovementsTableProps {
  movements: InventoryMovementHistoryItem[];
}

function getColumns(): GridColDef<InventoryMovementHistoryItem>[] {
  return [
    {
      field: "movedAt",
      headerName: "Fecha",
      minWidth: 170,
      valueFormatter: (params: GridValueFormatterParams<string>) => formatSupplierDate(params.value),
    },
    {
      field: "movementType",
      headerName: "Tipo",
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<InventoryMovementHistoryItem>) => (
        <Chip size="small" label={formatMovementTypeLabel(params.row.movementType)} color={params.row.quantity > 0 ? "success" : "default"} />
      ),
    },
    {
      field: "product",
      headerName: "Producto",
      flex: 1,
      minWidth: 220,
      sortable: false,
      renderCell: (params: GridRenderCellParams<InventoryMovementHistoryItem>) => (
        <Stack justifyContent="center" sx={{ height: "100%" }}>
          <Typography variant="subtitle2">{params.row.product.name}</Typography>
          <Typography variant="body2" color="textSecondary">{params.row.variant.name ?? params.row.variant.sku}</Typography>
        </Stack>
      ),
    },
    {
      field: "quantity",
      headerName: "Cantidad",
      minWidth: 120,
      valueFormatter: (params: GridValueFormatterParams<number>) => formatQuantity(params.value),
    },
    {
      field: "unitCostCents",
      headerName: "Costo unitario",
      minWidth: 150,
      valueFormatter: (params: GridValueFormatterParams<number | null>) => params.value === null ? "Sin costo" : formatSupplierCurrency(params.value),
    },
    {
      field: "location",
      headerName: "Ubicacion",
      minWidth: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams<InventoryMovementHistoryItem>) => (
        <Stack justifyContent="center" sx={{ height: "100%" }}>
          <Typography variant="subtitle2">{params.row.location.name}</Typography>
          <Typography variant="body2" color="textSecondary">{params.row.location.code}</Typography>
        </Stack>
      ),
    },
    {
      field: "movedBy",
      headerName: "Registrado por",
      minWidth: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams<InventoryMovementHistoryItem>) => (
        <Typography variant="body2" color="textSecondary">
          {params.row.movedBy.fullName ?? params.row.movedBy.email ?? "Sistema"}
        </Typography>
      ),
    },
  ];
}

export function InventoryMovementsTable({ movements }: InventoryMovementsTableProps) {
  return (
    <AppDataGrid
      rows={movements}
      columns={getColumns()}
      searchPlaceholder="Buscar por producto, tipo o ubicacion"
      searchValueExtractor={(movement) => [movement.product.name, movement.variant.name ?? "", movement.variant.sku, movement.location.name, movement.location.code, movement.movementType].join(" ")}
      emptyMessage="Todavia no hay movimientos de inventario asociados a este proveedor."
      initialPageSize={5}
      pageSizeOptions={[5, 10, 25]}
    />
  );
}
