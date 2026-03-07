"use client";

import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { AdminUsersTable } from "@/features/auth/components/AdminUsersTable";
import { useAdminUsersQuery } from "@/features/auth/admin-users.queries";

interface AdminUsersListProps {
  showCreatedMessage?: boolean;
}

export function AdminUsersList({ showCreatedMessage = false }: AdminUsersListProps) {
  const adminUsersQuery = useAdminUsersQuery();

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Box>
          <Typography variant="h6">Usuarios internos</Typography>
          <Typography variant="body2" color="textSecondary">
            Consulta cuentas creadas, roles asignados y ultimo acceso del personal.
          </Typography>
        </Box>
        <Button component={Link} href="/admin/users/create" variant="contained">
          Nuevo usuario
        </Button>
      </Stack>

      {showCreatedMessage ? (
        <Alert severity="success">Usuario creado correctamente.</Alert>
      ) : null}

      {adminUsersQuery.isLoading ? (
        <Stack alignItems="center" py={6} spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="textSecondary">
            Cargando usuarios del sistema...
          </Typography>
        </Stack>
      ) : null}

      {adminUsersQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => adminUsersQuery.refetch()}>
              Reintentar
            </Button>
          }
        >
          {adminUsersQuery.error.message}
        </Alert>
      ) : null}

      {adminUsersQuery.isSuccess && adminUsersQuery.data.users.length === 0 ? (
        <Alert severity="info">No hay usuarios internos registrados todavia.</Alert>
      ) : null}

      {adminUsersQuery.isSuccess && adminUsersQuery.data.users.length > 0 ? (
        <AdminUsersTable users={adminUsersQuery.data.users} />
      ) : null}
    </Stack>
  );
}