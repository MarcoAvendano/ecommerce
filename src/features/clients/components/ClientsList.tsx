"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import AlertDialog from "@/app/components/ui-components/dialog/AlertDialog";
import { ClientCreateDrawer } from "@/features/clients/components/ClientCreateDrawer";
import { ClientsTable } from "@/features/clients/components/ClientsTable";
import { useDeleteClientMutation } from "@/features/clients/clients.mutations";
import { useClientsQuery } from "@/features/clients/clients.queries";
import type { ClientListItem } from "@/features/clients/clients.types";

export function ClientsList() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<ClientListItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const clientsQuery = useClientsQuery();

  const deleteClientMutation = useDeleteClientMutation({
    onSuccess: (result) => {
      setSuccessMessage(result.message);
      setDeletingClient(null);
    },
  });

  const handleDeleteClient = async () => {
    if (!deletingClient) {
      return;
    }

    await deleteClientMutation.mutateAsync(deletingClient.id);
  };

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Box>
          <Typography variant="h6">Clientes registrados</Typography>
          <Typography variant="body2" color="textSecondary">
            Consulta el padrón comercial y crea nuevos clientes sin salir del listado.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            setSuccessMessage(null);
            setCreateDrawerOpen(true);
          }}
        >
          Agregar cliente
        </Button>
      </Stack>

      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

      {clientsQuery.isLoading ? (
        <Stack alignItems="center" py={6} spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="textSecondary">
            Cargando clientes registrados...
          </Typography>
        </Stack>
      ) : null}

      {clientsQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => clientsQuery.refetch()}>
              Reintentar
            </Button>
          }
        >
          {clientsQuery.error.message}
        </Alert>
      ) : null}

      {clientsQuery.isSuccess && clientsQuery.data.clients.length === 0 ? (
        <Alert severity="info">No hay clientes registrados todavia.</Alert>
      ) : null}

      {clientsQuery.isSuccess && clientsQuery.data.clients.length > 0 ? (
        <ClientsTable
          clients={clientsQuery.data.clients}
          onDelete={(client) => {
            setSuccessMessage(null);
            deleteClientMutation.reset();
            setDeletingClient(client);
          }}
        />
      ) : null}

      <ClientCreateDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onCompleted={(message) => setSuccessMessage(message)}
      />

      <AlertDialog
        open={Boolean(deletingClient)}
        onClose={() => {
          deleteClientMutation.reset();
          setDeletingClient(null);
        }}
        onConfirm={() => {
          void handleDeleteClient();
        }}
        title="Eliminar cliente"
        confirmText="Eliminar cliente"
        isPending={deleteClientMutation.isPending}
      >
        {deleteClientMutation.error?.message
          ? deleteClientMutation.error.message
          : deletingClient
            ? `Se eliminara a ${deletingClient.fullName}. Sus direcciones tambien se eliminaran y las ventas historicas conservaran el registro, pero quedaran sin cliente asociado.`
            : ""}
      </AlertDialog>
    </Stack>
  );
}
