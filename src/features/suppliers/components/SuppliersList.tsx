"use client";

import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import AlertDialog from "@/app/components/ui-components/dialog/AlertDialog";
import { SupplierCreateDrawer } from "@/features/suppliers/components/SupplierCreateDrawer";
import { SuppliersTable } from "@/features/suppliers/components/SuppliersTable";
import { useDeleteSupplierMutation } from "@/features/suppliers/suppliers.mutations";
import { useSuppliersQuery } from "@/features/suppliers/suppliers.queries";
import type { SupplierListItem } from "@/features/suppliers/suppliers.types";

export function SuppliersList() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierListItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const suppliersQuery = useSuppliersQuery();

  const deleteSupplierMutation = useDeleteSupplierMutation({
    onSuccess: (result) => {
      setSuccessMessage(result.message);
      setDeletingSupplier(null);
    },
  });

  const handleDeleteSupplier = async () => {
    if (!deletingSupplier) {
      return;
    }

    await deleteSupplierMutation.mutateAsync(deletingSupplier.id);
  };

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
        <Box>
          <Typography variant="h6">Proveedores registrados</Typography>
          <Typography variant="body2" color="textSecondary">
            Administra proveedores, relaciones de compra y el origen auditable de cada ingreso de stock.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            setSuccessMessage(null);
            setCreateDrawerOpen(true);
          }}
        >
          Agregar proveedor
        </Button>
      </Stack>

      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

      {suppliersQuery.isLoading ? (
        <Stack alignItems="center" py={6} spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="textSecondary">
            Cargando proveedores...
          </Typography>
        </Stack>
      ) : null}

      {suppliersQuery.isError ? (
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={() => suppliersQuery.refetch()}>Reintentar</Button>}
        >
          {suppliersQuery.error.message}
        </Alert>
      ) : null}

      {suppliersQuery.isSuccess && suppliersQuery.data.suppliers.length === 0 ? (
        <Alert severity="info">No hay proveedores registrados todavia.</Alert>
      ) : null}

      {suppliersQuery.isSuccess && suppliersQuery.data.suppliers.length > 0 ? (
        <SuppliersTable
          suppliers={suppliersQuery.data.suppliers}
          onDelete={(supplier) => {
            setSuccessMessage(null);
            deleteSupplierMutation.reset();
            setDeletingSupplier(supplier);
          }}
        />
      ) : null}

      <SupplierCreateDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onCompleted={(message) => setSuccessMessage(message)}
      />

      <AlertDialog
        open={Boolean(deletingSupplier)}
        onClose={() => {
          deleteSupplierMutation.reset();
          setDeletingSupplier(null);
        }}
        onConfirm={() => {
          void handleDeleteSupplier();
        }}
        title="Eliminar proveedor"
        confirmText="Eliminar proveedor"
        isPending={deleteSupplierMutation.isPending}
      >
        {deleteSupplierMutation.error?.message
          ? deleteSupplierMutation.error.message
          : deletingSupplier
            ? `Se eliminara el proveedor ${deletingSupplier.name}. Esta accion solo esta permitida si el proveedor no tiene compras asociadas.`
            : ""}
      </AlertDialog>
    </Stack>
  );
}
