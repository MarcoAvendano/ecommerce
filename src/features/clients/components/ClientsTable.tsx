"use client";

import Link from "next/link";
import { Chip, Stack, Typography } from "@mui/material";
import { IconTrash } from "@tabler/icons-react";
import type {
  GridColDef,
  GridRenderCellParams,
  GridValueFormatterParams,
} from "@mui/x-data-grid";
import { AppDataGrid } from "@/app/components/shared/data-grid/AppDataGrid";
import { RowActionsMenu } from "@/features/catalog/components/RowActionsMenu";
import type { ClientListItem } from "@/features/clients/clients.types";

interface ClientsTableProps {
  clients: ClientListItem[];
  onDelete: (client: ClientListItem) => void;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function getClientColumns(
  onDelete: (client: ClientListItem) => void,
): GridColDef<ClientListItem>[] {
  return [
    {
      field: "fullName",
      headerName: "Cliente",
      flex: 1,
      minWidth: 220,
      sortable: true,
      renderCell: (params: GridRenderCellParams<ClientListItem>) => (
        <Stack justifyContent="center" sx={{ height: "100%" }}>
          <Typography
            component={Link}
            href={`/apps/clients/${params.row.id}`}
            variant="subtitle2"
            sx={{ textDecoration: "none", color: "primary.main", fontWeight: 600 }}
          >
            {params.row.fullName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {params.row.documentNumber || "Sin documento registrado"}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "email",
      headerName: "Correo",
      flex: 1,
      minWidth: 220,
      sortable: true,
      renderCell: (params: GridRenderCellParams<ClientListItem>) => (
        <Stack justifyContent="center" sx={{ height: "100%" }}>
          <Typography variant="body2" color="textSecondary">
            {params.row.email || "Sin correo"}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "phone",
      headerName: "Telefono",
      flex: 0.8,
      minWidth: 160,
      sortable: true,
      renderCell: (params: GridRenderCellParams<ClientListItem>) => (
        <Typography variant="body2" color="textSecondary">
          {params.row.phone || "Sin telefono"}
        </Typography>
      ),
    },
    {
      field: "documentType",
      headerName: "Documento",
      flex: 0.8,
      minWidth: 180,
      sortable: true,
      renderCell: (params: GridRenderCellParams<ClientListItem>) =>
        params.row.documentType ? (
          <Chip label={params.row.documentType} size="small" variant="outlined" />
        ) : (
          <Typography variant="body2" color="textSecondary">
            Sin tipo
          </Typography>
        ),
    },
    {
      field: "createdAt",
      headerName: "Registrado",
      minWidth: 190,
      flex: 0.8,
      sortable: true,
      valueFormatter: (params: GridValueFormatterParams<string>) => formatDate(params.value),
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
      renderCell: (params: GridRenderCellParams<ClientListItem>) => (
        <RowActionsMenu
          tooltip="Acciones del cliente"
          actions={[
            {
              id: "delete-client",
              label: "Eliminar cliente",
              icon: <IconTrash color="red" size={18} />,
              onClick: () => onDelete(params.row),
            },
          ]}
        />
      ),
    },
  ];
}

export function ClientsTable({ clients, onDelete }: ClientsTableProps) {
  return (
    <AppDataGrid
      rows={clients}
      columns={getClientColumns(onDelete)}
      searchPlaceholder="Buscar por nombre, correo, telefono o documento"
      searchValueExtractor={(client) =>
        [
          client.fullName,
          client.email ?? "",
          client.phone ?? "",
          client.documentType ?? "",
          client.documentNumber ?? "",
        ].join(" ")
      }
      emptyMessage="No hay clientes que coincidan con los filtros actuales."
      initialPageSize={10}
      pageSizeOptions={[10, 25, 50]}
    />
  );
}
