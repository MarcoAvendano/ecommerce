"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import AlertDialog from "@/app/components/ui-components/dialog/AlertDialog";
import BlankCard from "@/app/components/shared/BlankCard";
import { RowActionsMenu } from "@/features/catalog/components/RowActionsMenu";
import { ClientAddressDrawer } from "@/features/clients/components/ClientAddressDrawer";
import { ClientForm } from "@/features/clients/components/ClientForm";
import { useDeleteClientAddressMutation } from "@/features/clients/clients.mutations";
import { useClientDetailQuery } from "@/features/clients/clients.queries";
import type { ClientAddressItem } from "@/features/clients/clients.types";

interface ClientDetailPageClientProps {
  clientId: string;
}

function formatAddressLocation(address: ClientAddressItem) {
  return [address.city, address.state].filter(Boolean).join(", ");
}

export function ClientDetailPageClient({ clientId }: ClientDetailPageClientProps) {
  const clientQuery = useClientDetailQuery(clientId);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [addressDrawerState, setAddressDrawerState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    address: ClientAddressItem | null;
  }>({
    open: false,
    mode: "create",
    address: null,
  });
  const [deletingAddress, setDeletingAddress] = useState<ClientAddressItem | null>(null);
  const deleteAddressMutation = useDeleteClientAddressMutation({
    onSuccess: async (result) => {
      setSuccessMessage(result.message);
      setDeletingAddress(null);
      await clientQuery.refetch();
    },
  });

  if (clientQuery.isLoading) {
    return (
      <Stack alignItems="center" py={8} spacing={2}>
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">
          Cargando detalle del cliente...
        </Typography>
      </Stack>
    );
  }

  if (clientQuery.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => clientQuery.refetch()}>
            Reintentar
          </Button>
        }
      >
        {clientQuery.error.message}
      </Alert>
    );
  }

  const client = clientQuery.data?.client;

  if (!client) {
    return <Alert severity="error">No se encontro el cliente solicitado.</Alert>;
  }

  const handleAddressDrawerClose = () => {
    setAddressDrawerState({
      open: false,
      mode: "create",
      address: null,
    });
  };

  const handleDeleteAddress = async () => {
    if (!deletingAddress) {
      return;
    }

    await deleteAddressMutation.mutateAsync({
      clientId,
      addressId: deletingAddress.id,
    });
  };

  return (
    <Stack spacing={3}>
      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} md={7}>
          <BlankCard>
            <Box sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6">Datos del cliente</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Edita la informacion principal del cliente y conserva el historial comercial asociado.
                  </Typography>
                </Box>

                <ClientForm
                  mode="edit"
                  client={client}
                  hideIntro
                  submitLabel="Guardar cliente"
                  onCompleted={(message) => {
                    setSuccessMessage(message);
                    void clientQuery.refetch();
                  }}
                />
              </Stack>
            </Box>
          </BlankCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <BlankCard>
            <Box sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
                  <Box>
                    <Typography variant="h6">Direcciones</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Resumen de direcciones registradas para el cliente.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      setSuccessMessage(null);
                      setAddressDrawerState({
                        open: true,
                        mode: "create",
                        address: null,
                      });
                    }}
                  >
                    Agregar direccion
                  </Button>
                </Stack>

                {client.addresses.length === 0 ? (
                  <Alert severity="info">El cliente aun no tiene direcciones registradas.</Alert>
                ) : (
                  <Stack spacing={2}>
                    {client.addresses.map((address) => (
                      <Box
                        key={address.id}
                        sx={{
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          p: 2,
                        }}
                      >
                        <Stack spacing={1.25}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {address.label}
                            </Typography>
                            {address.isDefault ? <Chip label="Predeterminada" size="small" color="primary" /> : null}
                            <Box sx={{ ml: "auto" }}>
                              <RowActionsMenu
                                tooltip="Acciones de la direccion"
                                actions={[
                                  {
                                    id: "edit-address",
                                    label: "Editar direccion",
                                    icon: <IconEdit size={18} />,
                                    onClick: () => {
                                      setSuccessMessage(null);
                                      setAddressDrawerState({
                                        open: true,
                                        mode: "edit",
                                        address,
                                      });
                                    },
                                  },
                                  {
                                    id: "delete-address",
                                    label: "Eliminar direccion",
                                    icon: <IconTrash size={18} />,
                                    onClick: () => {
                                      setSuccessMessage(null);
                                      deleteAddressMutation.reset();
                                      setDeletingAddress(address);
                                    },
                                  },
                                ]}
                              />
                            </Box>
                          </Stack>

                          <Typography variant="body2">{address.line1}</Typography>
                          {address.line2 ? <Typography variant="body2">{address.line2}</Typography> : null}
                          <Typography variant="body2">{formatAddressLocation(address)}</Typography>
                          {address.postalCode ? <Typography variant="body2">{address.postalCode}</Typography> : null}
                          <Typography variant="body2">{address.country}</Typography>
                          {client.phone ? <Typography variant="body2">{client.phone}</Typography> : null}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Box>
          </BlankCard>
        </Grid>
      </Grid>

      <ClientAddressDrawer
        clientId={clientId}
        open={addressDrawerState.open}
        mode={addressDrawerState.mode}
        address={addressDrawerState.address}
        onClose={handleAddressDrawerClose}
        onCompleted={async (message) => {
          setSuccessMessage(message);
          await clientQuery.refetch();
        }}
      />

      <AlertDialog
        open={Boolean(deletingAddress)}
        onClose={() => {
          deleteAddressMutation.reset();
          setDeletingAddress(null);
        }}
        onConfirm={() => {
          void handleDeleteAddress();
        }}
        title="Eliminar direccion"
        confirmText="Eliminar direccion"
        isPending={deleteAddressMutation.isPending}
      >
        {deleteAddressMutation.error?.message
          ? deleteAddressMutation.error.message
          : deletingAddress
            ? `Se eliminara la direccion ${deletingAddress.label}. Esta accion no se puede deshacer.`
            : ""}
      </AlertDialog>
    </Stack>
  );
}
