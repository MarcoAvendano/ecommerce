"use client";

import { useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import BlankCard from "@/app/components/shared/BlankCard";
import AlertDialog from "@/app/components/ui-components/dialog/AlertDialog";
import { RowActionsMenu } from "@/features/catalog/components/RowActionsMenu";
import { InventoryMovementsTable } from "@/features/suppliers/components/InventoryMovementsTable";
import { PurchaseOrderDrawer } from "@/features/suppliers/components/PurchaseOrderDrawer";
import { PurchaseOrderReceiveDrawer } from "@/features/suppliers/components/PurchaseOrderReceiveDrawer";
import { PurchaseOrdersTable } from "@/features/suppliers/components/PurchaseOrdersTable";
import { SupplierContactDrawer } from "@/features/suppliers/components/SupplierContactDrawer";
import { SupplierForm } from "@/features/suppliers/components/SupplierForm";
import { useDeleteSupplierContactMutation } from "@/features/suppliers/suppliers.mutations";
import {
  usePurchaseOrderDetailQuery,
  useSupplierDetailQuery,
} from "@/features/suppliers/suppliers.queries";
import { formatPurchaseOrderStatusColor, formatPurchaseOrderStatusLabel, formatSupplierDate } from "@/features/suppliers/suppliers.formatters";
import type { PurchaseOrderListItem, SupplierContactItem } from "@/features/suppliers/suppliers.types";

interface SupplierDetailPageClientProps {
  supplierId: string;
}

export function SupplierDetailPageClient({ supplierId }: SupplierDetailPageClientProps) {
  const supplierQuery = useSupplierDetailQuery(supplierId);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [contactDrawerState, setContactDrawerState] = useState<{ open: boolean; mode: "create" | "edit"; contact: SupplierContactItem | null }>({
    open: false,
    mode: "create",
    contact: null,
  });
  const [deletingContact, setDeletingContact] = useState<SupplierContactItem | null>(null);
  const [purchaseDrawerState, setPurchaseDrawerState] = useState<{ open: boolean; mode: "create" | "edit" | "view"; orderId: string | null }>({
    open: false,
    mode: "create",
    orderId: null,
  });
  const [receiveOrderId, setReceiveOrderId] = useState<string | null>(null);

  const selectedPurchaseOrderId = purchaseDrawerState.orderId ?? receiveOrderId ?? "";
  const purchaseOrderQuery = usePurchaseOrderDetailQuery(selectedPurchaseOrderId, {
    enabled: Boolean(selectedPurchaseOrderId),
    includeMovements: false,
  });
  const deleteContactMutation = useDeleteSupplierContactMutation({
    onSuccess: (result) => {
      setSuccessMessage(result.message);
      setDeletingContact(null);
    },
  });

  if (supplierQuery.isLoading) {
    return (
      <Stack alignItems="center" py={8} spacing={2}>
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">Cargando detalle del proveedor...</Typography>
      </Stack>
    );
  }

  if (supplierQuery.isError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => supplierQuery.refetch()}>Reintentar</Button>}>
        {supplierQuery.error.message}
      </Alert>
    );
  }

  const supplier = supplierQuery.data?.supplier;

  if (!supplier) {
    return <Alert severity="error">No se encontro el proveedor solicitado.</Alert>;
  }

  const selectedOrder = purchaseOrderQuery.data?.order ?? null;

  return (
    <Stack spacing={3}>
      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} md={7} sx={{ minWidth: 0 }}>
          <BlankCard>
            <Box sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6">Datos del proveedor</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Los productos ingresan al inventario solo cuando se recepciona una compra asociada a este proveedor.
                  </Typography>
                </Box>

                <SupplierForm
                  mode="edit"
                  supplier={supplier}
                  hideIntro
                  submitLabel="Guardar proveedor"
                  onCompleted={(message) => {
                    setSuccessMessage(message);
                    void supplierQuery.refetch();
                  }}
                />
              </Stack>
            </Box>
          </BlankCard>
        </Grid>

        <Grid item xs={12} md={5} sx={{ minWidth: 0 }}>
          <BlankCard>
            <Box sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
                  <Box>
                    <Typography variant="h6">Contactos</Typography>
                    <Typography variant="body2" color="textSecondary">Responsables operativos y comerciales del proveedor.</Typography>
                  </Box>
                  <Button variant="contained" size="small" startIcon={<IconPlus size={18} />} onClick={() => setContactDrawerState({ open: true, mode: "create", contact: null })}>
                    Agregar contacto
                  </Button>
                </Stack>

                {supplier.contacts.length === 0 ? (
                  <Alert severity="info">El proveedor aun no tiene contactos registrados.</Alert>
                ) : (
                  <Stack spacing={2}>
                    {supplier.contacts.map((contact) => (
                      <Box key={contact.id} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2 }}>
                        <Stack spacing={1.25}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="subtitle1" fontWeight={600}>{contact.fullName}</Typography>
                            {contact.role ? <Chip label={contact.role} size="small" variant="outlined" /> : null}
                            <Box sx={{ ml: "auto" }}>
                              <RowActionsMenu
                                tooltip="Acciones del contacto"
                                actions={[
                                  { id: "edit-contact", label: "Editar contacto", icon: <IconEdit size={18} />, onClick: () => setContactDrawerState({ open: true, mode: "edit", contact }) },
                                  { id: "delete-contact", label: "Eliminar contacto", icon: <IconTrash size={18} />, onClick: () => setDeletingContact(contact) },
                                ]}
                              />
                            </Box>
                          </Stack>
                          <Typography variant="body2" color="textSecondary">{contact.email || "Sin correo"}</Typography>
                          <Typography variant="body2" color="textSecondary">{contact.phone || "Sin telefono"}</Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Box>
          </BlankCard>
        </Grid>

        <Grid item xs={12} sx={{ minWidth: 0 }}>
          <BlankCard>
            <Box sx={{ p: { xs: 2.5, md: 3 }, minWidth: 0, maxWidth: "100%" }}>
              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
                  <Box>
                    <Typography variant="h6">Ordenes de compra</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Cada ingreso de stock debe venir desde una recepcion registrada en este bloque.
                    </Typography>
                  </Box>
                  <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => setPurchaseDrawerState({ open: true, mode: "create", orderId: null })}>
                    Nueva orden de compra
                  </Button>
                </Stack>

                {supplier.purchaseOrders.length === 0 ? (
                  <Alert severity="info">Todavia no hay ordenes de compra para este proveedor.</Alert>
                ) : (
                  <PurchaseOrdersTable
                    orders={supplier.purchaseOrders}
                    onEdit={(order) => setPurchaseDrawerState({ open: true, mode: "edit", orderId: order.id })}
                    onReceive={(order) => setReceiveOrderId(order.id)}
                    onView={(order) => setPurchaseDrawerState({ open: true, mode: "view", orderId: order.id })}
                  />
                )}
              </Stack>
            </Box>
          </BlankCard>
        </Grid>

        <Grid item xs={12} sx={{ minWidth: 0 }}>
          <BlankCard>
            <Box sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6">Historial de movimientos</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Trazabilidad de ingresos y movimientos de inventario vinculados a compras del proveedor.
                  </Typography>
                </Box>
                {supplier.recentMovements.length === 0 ? (
                  <Alert severity="info">Todavia no existen ingresos registrados para este proveedor.</Alert>
                ) : (
                  <InventoryMovementsTable movements={supplier.recentMovements} />
                )}
              </Stack>
            </Box>
          </BlankCard>
        </Grid>
      </Grid>

      <SupplierContactDrawer
        supplierId={supplierId}
        open={contactDrawerState.open}
        mode={contactDrawerState.mode}
        contact={contactDrawerState.contact}
        onClose={() => setContactDrawerState({ open: false, mode: "create", contact: null })}
        onCompleted={async (message) => {
          setSuccessMessage(message);
          await supplierQuery.refetch();
        }}
      />

      <PurchaseOrderDrawer
        supplierId={supplierId}
        open={purchaseDrawerState.open}
        mode={purchaseDrawerState.mode}
        order={purchaseDrawerState.mode === "create" ? null : selectedOrder}
        onClose={() => setPurchaseDrawerState({ open: false, mode: "create", orderId: null })}
        onCompleted={async (message) => {
          setSuccessMessage(message);
          await supplierQuery.refetch();
        }}
      />

      <PurchaseOrderReceiveDrawer
        supplierId={supplierId}
        open={Boolean(receiveOrderId)}
        order={receiveOrderId ? selectedOrder : null}
        onClose={() => setReceiveOrderId(null)}
        onCompleted={async (message) => {
          setSuccessMessage(message);
          await supplierQuery.refetch();
        }}
      />

      <AlertDialog
        open={Boolean(deletingContact)}
        onClose={() => {
          deleteContactMutation.reset();
          setDeletingContact(null);
        }}
        onConfirm={() => {
          if (!deletingContact) {
            return;
          }

          void deleteContactMutation.mutateAsync({ supplierId, contactId: deletingContact.id });
        }}
        title="Eliminar contacto"
        confirmText="Eliminar contacto"
        isPending={deleteContactMutation.isPending}
      >
        {deleteContactMutation.error?.message
          ? deleteContactMutation.error.message
          : deletingContact
            ? `Se eliminara el contacto ${deletingContact.fullName}.`
            : ""}
      </AlertDialog>

      {purchaseOrderQuery.isFetching && selectedPurchaseOrderId ? (
        <Alert severity="info">
          Cargando orden seleccionada para {receiveOrderId ? "registrar el ingreso" : "editar la compra"}...
        </Alert>
      ) : null}

      {supplier.purchaseOrders.length > 0 ? (
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} useFlexGap flexWrap="wrap">
          {supplier.purchaseOrders.slice(0, 3).map((order: PurchaseOrderListItem) => (
            <Chip
              key={order.id}
              label={`${order.orderNumber} • ${formatPurchaseOrderStatusLabel(order.status)} • ${formatSupplierDate(order.orderedAt)}`}
              color={formatPurchaseOrderStatusColor(order.status)}
              variant="outlined"
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
