"use client";

import Link from "next/link";
import { Chip, Stack, Typography } from "@mui/material";
import { IconTrash } from "@tabler/icons-react";
import type { GridColDef, GridRenderCellParams, GridValueFormatterParams } from "@mui/x-data-grid";
import { AppDataGrid } from "@/app/components/shared/data-grid/AppDataGrid";
import { RowActionsMenu } from "@/features/catalog/components/RowActionsMenu";
import { formatSupplierDate } from "@/features/suppliers/suppliers.formatters";
import type { SupplierListItem } from "@/features/suppliers/suppliers.types";

interface SuppliersTableProps {
  suppliers: SupplierListItem[];
  onDelete: (supplier: SupplierListItem) => void;
}

function getColumns(onDelete: (supplier: SupplierListItem) => void): GridColDef<SupplierListItem>[] {
  return [
    {
      field: "name",
      headerName: "Proveedor",
      flex: 1,
      minWidth: 240,
      renderCell: (params: GridRenderCellParams<SupplierListItem>) => (
        <Stack justifyContent="center" sx={{ height: "100%" }}>
          <Typography
            component={Link}
            href={`/apps/suppliers/${params.row.id}`}
            variant="subtitle2"
            sx={{ textDecoration: "none", color: "primary.main", fontWeight: 600 }}
          >
            {params.row.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {params.row.taxId || "Sin identificador fiscal"}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "contact",
      headerName: "Contacto",
      flex: 1,
      minWidth: 220,
      sortable: false,
      renderCell: (params: GridRenderCellParams<SupplierListItem>) => (
        <Stack justifyContent="center" sx={{ height: "100%" }}>
          <Typography variant="body2" color="textSecondary">{params.row.email || "Sin correo"}</Typography>
          <Typography variant="body2" color="textSecondary">{params.row.phone || "Sin telefono"}</Typography>
        </Stack>
      ),
    },
    {
      field: "paymentTermsDays",
      headerName: "Credito",
      minWidth: 130,
      valueFormatter: (params: GridValueFormatterParams<number>) => `${params.value} dias`,
    },
    {
      field: "isActive",
      headerName: "Estado",
      minWidth: 140,
      renderCell: (params: GridRenderCellParams<SupplierListItem>) => (
        <Chip
          size="small"
          label={params.row.isActive ? "Activo" : "Inactivo"}
          color={params.row.isActive ? "success" : "default"}
          variant={params.row.isActive ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Registro",
      minWidth: 180,
      valueFormatter: (params: GridValueFormatterParams<string>) => formatSupplierDate(params.value),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 90,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<SupplierListItem>) => (
        <RowActionsMenu
          tooltip="Acciones del proveedor"
          actions={[
            {
              id: "delete-supplier",
              label: "Eliminar proveedor",
              icon: <IconTrash color="red" size={18} />,
              onClick: () => onDelete(params.row),
            },
          ]}
        />
      ),
    },
  ];
}

export function SuppliersTable({ suppliers, onDelete }: SuppliersTableProps) {
  return (
    <AppDataGrid
      rows={suppliers}
      columns={getColumns(onDelete)}
      searchPlaceholder="Buscar por nombre, correo, telefono o identificador fiscal"
      searchValueExtractor={(supplier) => [supplier.name, supplier.email ?? "", supplier.phone ?? "", supplier.taxId ?? ""].join(" ")}
      filters={[
        {
          key: "status",
          label: "Estado",
          allLabel: "Todos",
          options: [
            { value: "active", label: "Activos" },
            { value: "inactive", label: "Inactivos" },
          ],
          getValue: (row) => (row.isActive ? "active" : "inactive"),
        },
      ]}
      emptyMessage="No hay proveedores que coincidan con los filtros actuales."
      initialPageSize={10}
      pageSizeOptions={[10, 25, 50]}
    />
  );
}
