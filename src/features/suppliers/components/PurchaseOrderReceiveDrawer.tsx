"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Typography } from "@mui/material";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { ResponsiveDrawer } from "@/app/components/ui-components/drawer/ResponsiveDrawer";
import { useReceivePurchaseOrderMutation } from "@/features/suppliers/suppliers.mutations";
import { usePurchaseCreateContextQuery } from "@/features/suppliers/suppliers.queries";
import { formatSupplierCurrency, formatQuantity } from "@/features/suppliers/suppliers.formatters";
import type { PurchaseOrderDetail } from "@/features/suppliers/suppliers.types";

interface PurchaseOrderReceiveDrawerProps {
  open: boolean;
  supplierId: string;
  order?: PurchaseOrderDetail | null;
  onClose: () => void;
  onCompleted: (message: string) => void;
}

function clampReceivedQty(value: string, max: number) {
  return Math.min(max, Math.max(0, Number(value) || 0));
}

export function PurchaseOrderReceiveDrawer({ open, supplierId, order = null, onClose, onCompleted }: PurchaseOrderReceiveDrawerProps) {
  const contextQuery = usePurchaseCreateContextQuery({ enabled: open, mode: "receipt" });
  const receiveOrderMutation = useReceivePurchaseOrderMutation({
    onSuccess: (result) => {
      onCompleted(result.message);
      onClose();
    },
  });
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  const pendingItems = useMemo(
    () => (order?.items ?? []).filter((item) => item.pendingQty > 0),
    [order],
  );
  const isPending = receiveOrderMutation.isPending;

  const handleDrawerClose = () => {
    if (isPending) {
      return;
    }

    onClose();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    setNotes("");
    setLocalError(null);
    setQuantities(Object.fromEntries(pendingItems.map((item) => [item.id, item.pendingQty.toString()])));
    setLocationId(contextQuery.data?.locations[0]?.id ?? "");
  }, [contextQuery.data?.locations, open, pendingItems]);

  const handleSubmit = async () => {
    if (!order) {
      return;
    }

    const items = pendingItems
      .map((item) => ({
        purchaseOrderItemId: item.id,
        receivedQty: Number(quantities[item.id] ?? "0"),
        pendingQty: item.pendingQty,
      }))
      .filter((item) => item.receivedQty > 0);

    if (!locationId) {
      setLocalError("Selecciona una ubicacion de ingreso.");
      return;
    }

    if (items.length === 0) {
      setLocalError("Ingresa al menos una cantidad recibida mayor a cero.");
      return;
    }

    const invalidItem = items.find((item) => item.receivedQty > item.pendingQty);

    if (invalidItem) {
      setLocalError("No puedes recibir mas unidades de las pendientes por linea.");
      return;
    }

    setLocalError(null);
    await receiveOrderMutation.mutateAsync({
      orderId: order.id,
      supplierId,
      input: {
        locationId,
        notes,
        items: items.map((item) => ({
          purchaseOrderItemId: item.purchaseOrderItemId,
          receivedQty: item.receivedQty,
        })),
      },
    });
  };

  return (
    <ResponsiveDrawer
      open={open}
      onClose={handleDrawerClose}
      ModalProps={{ disableScrollLock: true, keepMounted: true }}
      sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 620 } } }}
    >
      <DialogTitle>Registrar ingreso</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {localError ? <Alert severity="error">{localError}</Alert> : null}
          {receiveOrderMutation.error ? <Alert severity="error">{receiveOrderMutation.error.message}</Alert> : null}
          {order ? (
            <Typography variant="body2" color="textSecondary">
              Orden {order.orderNumber}. Solo se pueden ingresar cantidades pendientes y el stock se incrementara automaticamente en la ubicacion elegida.
            </Typography>
          ) : null}

          <Box>
            <CustomFormLabel htmlFor="receive-location">Ubicacion destino</CustomFormLabel>
            <CustomTextField
              id="receive-location"
              select
              fullWidth
              value={locationId}
              disabled={isPending || contextQuery.isLoading}
              onChange={(event) => setLocationId(event.target.value)}
            >
              {contextQuery.data?.locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name} ({location.code})
                </MenuItem>
              ))}
            </CustomTextField>
          </Box>

          <Box>
            <CustomFormLabel htmlFor="receive-notes">Notas</CustomFormLabel>
            <CustomTextField id="receive-notes" fullWidth multiline minRows={3} disabled={isPending} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Box>

          <Stack spacing={2}>
            {pendingItems.map((item) => (
              <Box key={item.id} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2">{item.productName}</Typography>
                      <Typography variant="body2" color="textSecondary">{item.variantName ?? item.sku}</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">Costo {formatSupplierCurrency(item.unitCostCents)}</Typography>
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Typography variant="body2">Solicitado: {formatQuantity(item.orderedQty)}</Typography>
                    <Typography variant="body2">Recibido: {formatQuantity(item.receivedQty)}</Typography>
                    <Typography variant="body2" fontWeight={700}>Pendiente: {formatQuantity(item.pendingQty)}</Typography>
                  </Stack>
                  <CustomTextField
                    type="number"
                    fullWidth
                    label="Cantidad a ingresar"
                    disabled={isPending}
                    value={quantities[item.id] ?? "0"}
                    onChange={(event) =>
                      setQuantities((current) => ({
                        ...current,
                        [item.id]: clampReceivedQty(event.target.value, item.pendingQty).toString(),
                      }))
                    }
                    inputProps={{ min: 0, max: item.pendingQty, step: 0.001 }}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDrawerClose} color="inherit" disabled={isPending}>Cancelar</Button>
        <Button onClick={() => void handleSubmit()} variant="contained" disabled={isPending || contextQuery.isLoading || !order || pendingItems.length === 0}>
          {isPending ? "Registrando..." : "Confirmar ingreso"}
        </Button>
      </DialogActions>
    </ResponsiveDrawer>
  );
}
