"use client";

import { useEffect, useMemo } from "react";
import { Alert, Box, Button, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Typography } from "@mui/material";
import { Controller, useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { ResponsiveDrawer } from "@/app/components/ui-components/drawer/ResponsiveDrawer";
import {
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
} from "@/features/suppliers/suppliers.mutations";
import { usePurchaseCreateContextQuery } from "@/features/suppliers/suppliers.queries";
import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderInput,
} from "@/features/suppliers/schemas";
import { computePurchaseOrderLineTotals, computePurchaseOrderTotals } from "@/features/suppliers/purchase-order.utils";
import { formatPurchaseOrderStatusLabel, formatSupplierCurrency } from "@/features/suppliers/suppliers.formatters";
import type { PurchaseOrderDetail } from "@/features/suppliers/suppliers.types";

interface PurchaseOrderDrawerProps {
  supplierId: string;
  open: boolean;
  mode: "create" | "edit" | "view";
  order?: PurchaseOrderDetail | null;
  onClose: () => void;
  onCompleted: (message: string) => void;
}

const EMPTY_ITEMS: CreatePurchaseOrderInput["items"] = [];

function clampNonNegative(value: string) {
  return Math.max(0, Number(value) || 0);
}

function clampTaxRate(value: string) {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function toEditablePurchaseStatus(status: PurchaseOrderDetail["status"]): CreatePurchaseOrderInput["status"] {
  if (status === "cancelled") {
    return "cancelled";
  }

  if (status === "sent" || status === "partial" || status === "received") {
    return "sent";
  }

  return "draft";
}

function getDefaultValues(supplierId: string, order?: PurchaseOrderDetail | null): CreatePurchaseOrderInput {
  if (!order) {
    return {
      supplierId,
      status: "draft",
      orderedAt: new Date().toISOString(),
      expectedAt: "",
      discountCents: 0,
      notes: "",
      items: [
        {
          productId: "",
          variantId: null,
          orderedQty: 1,
          unitCostCents: 0,
          taxRate: 0,
          supplierSku: "",
        },
      ],
    };
  }

  return {
    supplierId,
    status: toEditablePurchaseStatus(order.status),
    orderedAt: order.orderedAt,
    expectedAt: order.expectedAt ?? "",
    discountCents: order.discountCents,
    notes: order.notes ?? "",
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      orderedQty: item.orderedQty,
      unitCostCents: item.unitCostCents,
      taxRate: item.taxRate,
      supplierSku: item.supplierSku ?? "",
    })),
  };
}

export function PurchaseOrderDrawer({ supplierId, open, mode, order = null, onClose, onCompleted }: PurchaseOrderDrawerProps) {
  const contextQuery = usePurchaseCreateContextQuery({ enabled: open, mode: "create" });
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreatePurchaseOrderInput>({
    resolver: zodResolver(createPurchaseOrderSchema) as Resolver<CreatePurchaseOrderInput>,
    defaultValues: getDefaultValues(supplierId, order),
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const createOrderMutation = useCreatePurchaseOrderMutation({
    onSuccess: (result) => {
      onCompleted(result.message);
      onClose();
    },
  });
  const updateOrderMutation = useUpdatePurchaseOrderMutation({
    onSuccess: (result) => {
      onCompleted(result.message);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(getDefaultValues(supplierId, order));
  }, [open, order, reset, supplierId]);

  const isPending = createOrderMutation.isPending || updateOrderMutation.isPending;
  const isViewMode = mode === "view";
  const errorMessage = createOrderMutation.error?.message ?? updateOrderMutation.error?.message ?? null;
  const variants = contextQuery.data?.variants ?? [];
  const items = useWatch({ control, name: "items" }) ?? EMPTY_ITEMS;
  const discountCents = useWatch({ control, name: "discountCents" }) ?? 0;
  const totals = useMemo(() => {
    return computePurchaseOrderTotals(items, discountCents);
  }, [discountCents, items]);
  const isFormLocked = isPending || isViewMode;

  const handleDrawerClose = () => {
    if (isPending) {
      return;
    }

    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreatePurchaseOrderInput = {
      ...values,
      supplierId,
      orderedAt: fromDateTimeLocal(toDateTimeLocal(values.orderedAt)),
      expectedAt: values.expectedAt ? fromDateTimeLocal(toDateTimeLocal(values.expectedAt)) : "",
    };

    if (mode === "edit" && order) {
      await updateOrderMutation.mutateAsync({ id: order.id, ...payload });
      return;
    }

    await createOrderMutation.mutateAsync(payload);
  });

  return (
    <ResponsiveDrawer
      open={open}
      onClose={handleDrawerClose}
      ModalProps={{ disableScrollLock: true, keepMounted: true }}
      sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 760 } } }}
    >
      <DialogTitle>
        {mode === "edit" ? "Editar orden de compra" : mode === "view" ? "Detalle de orden de compra" : "Nueva orden de compra"}
      </DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ minWidth: 0 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <CustomFormLabel htmlFor="purchase-ordered-at">Fecha de orden</CustomFormLabel>
                <Controller
                  name="orderedAt"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      id="purchase-ordered-at"
                      type="datetime-local"
                      fullWidth
                      value={toDateTimeLocal(field.value)}
                      disabled={isFormLocked}
                      onChange={(event) => field.onChange(fromDateTimeLocal(event.target.value))}
                      error={Boolean(errors.orderedAt)}
                      helperText={errors.orderedAt?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <CustomFormLabel htmlFor="purchase-expected-at">Fecha esperada</CustomFormLabel>
                <Controller
                  name="expectedAt"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      id="purchase-expected-at"
                      type="datetime-local"
                      fullWidth
                      value={field.value ? toDateTimeLocal(field.value) : ""}
                      disabled={isFormLocked}
                      onChange={(event) => field.onChange(event.target.value ? fromDateTimeLocal(event.target.value) : "")}
                      error={Boolean(errors.expectedAt)}
                      helperText={errors.expectedAt?.message ?? "Opcional."}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <CustomFormLabel htmlFor="purchase-status">Estado</CustomFormLabel>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField id="purchase-status" select fullWidth value={field.value} onChange={field.onChange} disabled={isFormLocked} error={Boolean(errors.status)} helperText={errors.status?.message}>
                      {["draft", "sent", "cancelled"].map((status) => (
                        <MenuItem key={status} value={status}>{formatPurchaseOrderStatusLabel(status as typeof field.value)}</MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ minWidth: 0 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <CustomFormLabel htmlFor="purchase-discount">Descuento</CustomFormLabel>
                <Controller
                  name="discountCents"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      id="purchase-discount"
                      type="number"
                      fullWidth
                      value={field.value}
                      disabled={isFormLocked}
                      onChange={(event) => field.onChange(clampNonNegative(event.target.value))}
                      inputProps={{ min: 0, step: 1 }}
                      error={Boolean(errors.discountCents)}
                      helperText={errors.discountCents?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <CustomFormLabel htmlFor="purchase-tax">Impuestos calculados</CustomFormLabel>
                <CustomTextField
                  id="purchase-tax"
                  type="number"
                  fullWidth
                  value={totals.taxCents}
                  disabled
                  helperText="Se calculan automaticamente desde el impuesto por linea."
                />
              </Box>
            </Stack>

            <Box>
              <CustomFormLabel htmlFor="purchase-notes">Notas</CustomFormLabel>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <CustomTextField {...field} id="purchase-notes" fullWidth multiline minRows={3} disabled={isFormLocked} error={Boolean(errors.notes)} helperText={errors.notes?.message ?? "Opcional."} />
                )}
              />
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
              <Typography variant="h6">Lineas de compra</Typography>
              <Button
                variant="outlined"
                startIcon={<IconPlus size={18} />}
                disabled={isFormLocked}
                onClick={() => append({ productId: "", variantId: null, orderedQty: 1, unitCostCents: 0, taxRate: 0, supplierSku: "" })}
              >
                Agregar linea
              </Button>
            </Stack>

            <Stack spacing={2}>
              {fields.map((field, index) => {
                const selectedVariantId = items[index]?.variantId;
                const selectedVariant = variants.find((variant) => variant.variantId === selectedVariantId);
                const lineTotals = computePurchaseOrderLineTotals(items[index] ?? field);

                return (
                  <Box key={field.id} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2 }}>
                    <Stack spacing={2}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                        <Typography variant="subtitle2">Linea {index + 1}</Typography>
                        <Button color="error" startIcon={<IconTrash size={16} />} onClick={() => remove(index)} disabled={isFormLocked || fields.length === 1}>Eliminar</Button>
                      </Stack>

                      <Controller
                        name={`items.${index}.variantId`}
                        control={control}
                        render={({ field: variantField }) => (
                          <Box>
                            <CustomFormLabel htmlFor={`purchase-variant-${index}`}>Variante</CustomFormLabel>
                            <CustomTextField
                              id={`purchase-variant-${index}`}
                              select
                              fullWidth
                              value={variantField.value ?? ""}
                              disabled={isFormLocked}
                              onChange={(event) => {
                                const nextVariant = variants.find((variant) => variant.variantId === event.target.value);
                                variantField.onChange(nextVariant?.variantId ?? null);
                                setValue(`items.${index}.productId`, nextVariant?.productId ?? "");
                                setValue(`items.${index}.unitCostCents`, nextVariant?.defaultCostCents ?? 0);
                              }}
                              error={Boolean(errors.items?.[index]?.variantId || errors.items?.[index]?.productId)}
                              helperText={errors.items?.[index]?.variantId?.message ?? errors.items?.[index]?.productId?.message}
                            >
                              {variants.map((variant) => (
                                <MenuItem key={variant.variantId ?? variant.sku} value={variant.variantId ?? ""}>
                                  {variant.productName} - {variant.variantName ?? variant.sku}
                                </MenuItem>
                              ))}
                            </CustomTextField>
                          </Box>
                        )}
                      />

                      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ minWidth: 0 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <CustomFormLabel htmlFor={`purchase-qty-${index}`}>Cantidad</CustomFormLabel>
                          <Controller
                            name={`items.${index}.orderedQty`}
                            control={control}
                            render={({ field: qtyField }) => (
                              <CustomTextField
                                id={`purchase-qty-${index}`}
                                type="number"
                                fullWidth
                                value={qtyField.value}
                                disabled={isFormLocked}
                                onChange={(event) => qtyField.onChange(clampNonNegative(event.target.value))}
                                inputProps={{ min: 0, step: 0.001 }}
                                error={Boolean(errors.items?.[index]?.orderedQty)}
                                helperText={errors.items?.[index]?.orderedQty?.message}
                              />
                            )}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <CustomFormLabel htmlFor={`purchase-cost-${index}`}>Costo unitario</CustomFormLabel>
                          <Controller
                            name={`items.${index}.unitCostCents`}
                            control={control}
                            render={({ field: costField }) => (
                              <CustomTextField
                                id={`purchase-cost-${index}`}
                                type="number"
                                fullWidth
                                value={costField.value}
                                disabled={isFormLocked}
                                onChange={(event) => costField.onChange(clampNonNegative(event.target.value))}
                                inputProps={{ min: 0, step: 1 }}
                                error={Boolean(errors.items?.[index]?.unitCostCents)}
                                helperText={errors.items?.[index]?.unitCostCents?.message}
                              />
                            )}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <CustomFormLabel htmlFor={`purchase-tax-rate-${index}`}>Impuesto %</CustomFormLabel>
                          <Controller
                            name={`items.${index}.taxRate`}
                            control={control}
                            render={({ field: taxField }) => (
                              <CustomTextField
                                id={`purchase-tax-rate-${index}`}
                                type="number"
                                fullWidth
                                value={taxField.value}
                                disabled={isFormLocked}
                                onChange={(event) => taxField.onChange(clampTaxRate(event.target.value))}
                                inputProps={{ min: 0, max: 100, step: 0.01 }}
                                error={Boolean(errors.items?.[index]?.taxRate)}
                                helperText={errors.items?.[index]?.taxRate?.message}
                              />
                            )}
                          />
                        </Box>
                      </Stack>

                      <Box>
                        <CustomFormLabel htmlFor={`purchase-supplier-sku-${index}`}>SKU del proveedor</CustomFormLabel>
                        <Controller
                          name={`items.${index}.supplierSku`}
                          control={control}
                          render={({ field: supplierSkuField }) => (
                            <CustomTextField {...supplierSkuField} id={`purchase-supplier-sku-${index}`} fullWidth disabled={isFormLocked} error={Boolean(errors.items?.[index]?.supplierSku)} helperText={errors.items?.[index]?.supplierSku?.message ?? "Opcional."} />
                          )}
                        />
                      </Box>

                      <Typography variant="body2" color="textSecondary" sx={{ wordBreak: "break-word" }}>
                        {selectedVariant ? `${selectedVariant.productName} - ${selectedVariant.variantName ?? selectedVariant.sku}` : "Selecciona una variante para completar la linea."}
                      </Typography>
                      <Typography variant="subtitle2">Subtotal linea: {formatSupplierCurrency(lineTotals.subtotalCents)}</Typography>
                      <Typography variant="body2" color="textSecondary">Impuesto linea: {formatSupplierCurrency(lineTotals.taxCents)}</Typography>
                      <Typography variant="subtitle2">Total linea: {formatSupplierCurrency(lineTotals.totalCents)}</Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            <Stack spacing={0.75} sx={{ alignSelf: { xs: "stretch", md: "flex-end" }, width: { xs: "100%", md: "auto" }, maxWidth: "100%" }}>
              <Typography variant="body2">Subtotal: {formatSupplierCurrency(totals.subtotalCents)}</Typography>
              <Typography variant="body2">Descuento: {formatSupplierCurrency(totals.discountCents)}</Typography>
              <Typography variant="body2">Impuestos: {formatSupplierCurrency(totals.taxCents)}</Typography>
              <Typography variant="h6">Total: {formatSupplierCurrency(totals.totalCents)}</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDrawerClose} color="inherit" disabled={isPending}>{isViewMode ? "Cerrar" : "Cancelar"}</Button>
          {!isViewMode ? (
            <Button type="submit" variant="contained" disabled={isPending || contextQuery.isLoading}>
              {isPending ? "Guardando..." : mode === "edit" ? "Guardar orden" : "Crear orden"}
            </Button>
          ) : null}
        </DialogActions>
      </Box>
    </ResponsiveDrawer>
  );
}
