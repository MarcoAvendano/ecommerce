"use client";

import {
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import type {
  GridColDef,
  GridRenderCellParams,
  GridValueFormatterParams,
  GridValueGetterParams,
} from "@mui/x-data-grid";
import { AppDataGrid, type AppDataGridFilterDefinition } from "@/app/components/shared/data-grid/AppDataGrid";
import type { AdminUserListItem } from "@/features/auth/admin-users.types";

interface AdminUsersTableProps {
  users: AdminUserListItem[];
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  if (!value) {
    return "Nunca";
  }

  return dateFormatter.format(new Date(value));
}

function getStatusColor(status: AdminUserListItem["status"]) {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "default";
    case "invited":
      return "warning";
    default:
      return "info";
  }
}

function getStatusLabel(status: AdminUserListItem["status"]) {
  switch (status) {
    case "active":
      return "Activo";
    case "inactive":
      return "Inactivo";
    case "invited":
      return "Invitado";
    default:
      return status;
  }
}

const adminUserColumns: GridColDef<AdminUserListItem>[] = [
  {
    field: "fullName",
    headerName: "Usuario",
    flex: 1,
    minWidth: 220,
    sortable: true,
    valueGetter: (params: GridValueGetterParams<AdminUserListItem>) => params.row.fullName || "Sin nombre",
    renderCell: (params: GridRenderCellParams<AdminUserListItem>) => (
      <Stack justifyContent="center" sx={{ height: "100%" }}>
        <Typography variant="subtitle2">{params.row.fullName || "Sin nombre"}</Typography>
      </Stack>
    ),
  },
  {
    field: "email",
    headerName: "Correo",
    flex: 1.1,
    minWidth: 240,
    sortable: true,
    renderCell: (params: GridRenderCellParams<AdminUserListItem>) => (
      <Stack justifyContent="center" sx={{ height: "100%" }}>
        <Typography variant="body2" color="textSecondary">
          {params.row.email}
        </Typography>
      </Stack>
    ),
  },
  {
    field: "roleNames",
    headerName: "Roles",
    flex: 1,
    minWidth: 220,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<AdminUserListItem>) => (
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ py: 1 }}>
        {params.row.roleNames.length > 0 ? (
          params.row.roleNames.map((roleName: string) => (
            <Chip key={`${params.row.id}-${roleName}`} label={roleName} size="small" />
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            Sin rol
          </Typography>
        )}
      </Stack>
    ),
  },
  {
    field: "status",
    headerName: "Estado",
    width: 140,
    sortable: true,
    renderCell: (params: GridRenderCellParams<AdminUserListItem>) => (
      <Chip
        label={getStatusLabel(params.row.status)}
        color={getStatusColor(params.row.status)}
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    field: "createdAt",
    headerName: "Creado",
    minWidth: 180,
    flex: 0.8,
    sortable: true,
    valueFormatter: (params: GridValueFormatterParams<string>) => formatDate(params.value),
  },
  {
    field: "lastSignInAt",
    headerName: "Ultimo acceso",
    minWidth: 190,
    flex: 0.9,
    sortable: true,
    valueFormatter: (params: GridValueFormatterParams<string | null>) => formatDate(params.value ?? null),
  },
];

const adminUserFilters: AppDataGridFilterDefinition<AdminUserListItem>[] = [
  {
    key: "status",
    label: "Estado",
    allLabel: "Todos los estados",
    options: [
      { value: "active", label: "Activo" },
      { value: "inactive", label: "Inactivo" },
      { value: "invited", label: "Invitado" },
    ],
    getValue: (user) => user.status,
  },
  {
    key: "role",
    label: "Rol",
    allLabel: "Todos los roles",
    options: [
      { value: "admin", label: "Administrador" },
      { value: "manager", label: "Manager" },
      { value: "cashier", label: "Cajero" },
      { value: "inventory", label: "Inventario" },
    ],
    getValue: (user) => user.roleCodes,
  },
];

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  return (
    <AppDataGrid
      rows={users}
      columns={adminUserColumns}
      filters={adminUserFilters}
      searchPlaceholder="Buscar por nombre o correo"
      searchValueExtractor={(user) => `${user.fullName ?? ""} ${user.email}`}
      emptyMessage="No hay usuarios que coincidan con los filtros actuales."
      initialPageSize={10}
      pageSizeOptions={[10, 25, 50]}
    />
  );
}