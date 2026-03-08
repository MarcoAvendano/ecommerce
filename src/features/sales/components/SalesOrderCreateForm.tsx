"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { useCreateSalesOrderMutation } from "@/features/sales/sales.mutations";
import { useSalesCreateContextQuery } from "@/features/sales/sales.queries";
import {
  createSalesOrderSchema,
  type CreateSalesOrderInput,
} from "@/features/sales/schemas";

const defaultValues: CreateSalesOrderInput = {
  locationId: "",
  paymentMethod: "cash",
  notes: "",
  discountCents: 0,
  items: [],
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(cents / 100);
}

export function SalesOrderCreateForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const salesContextQuery = useSalesCreateContextQuery();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<CreateSalesOrderInput>({
    resolver: zodResolver(createSalesOrderSchema) as Resolver<CreateSalesOrderInput>,
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const locationId = watch("locationId");
  const items = watch("items");
  const orderDiscountCents = watch("discountCents");

  const createSalesOrderMutation = useCreateSalesOrderMutation({
    onSuccess: (result) => {
      setSuccessMessage(`${result.message} Orden ${result.order.orderNumber}.`);
      reset(defaultValues);
    },
  });

  const variantOptions = salesContextQuery.data?.variants ?? [];
  const selectedVariantIds = new Set(items.map((item) => item.variantId));

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (accumulator, item) => accumulator + item.quantity * item.unitPriceCents,
      0,
    );
    const itemsDiscount = items.reduce(
      (accumulator, item) => accumulator + (item.discountCents ?? 0),
      0,
    );
    const total = subtotal - itemsDiscount - orderDiscountCents;

    return {
      subtotal,
      itemsDiscount,
      total: Math.max(total, 0),
    };
  }, [items, orderDiscountCents]);

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage(null);

    let hasInventoryError = false;

    values.items.forEach((item: CreateSalesOrderInput["items"][number], index: number) => {
      const variant = variantOptions.find((entry) => entry.id === item.variantId);

      if (!variant) {
        hasInventoryError = true;
        setError(`items.${index}.variantId`, {
          message: "Selecciona una variante valida.",
        });
        return;
      }

      const availableQty = variant.trackInventory
        ? variant.availableQtyByLocation[values.locationId] ?? 0
        : Number.POSITIVE_INFINITY;

      if (variant.trackInventory && item.quantity > availableQty) {
        hasInventoryError = true;
        setError(`items.${index}.quantity`, {
          message: `Solo hay ${availableQty} disponible(s) en la ubicacion seleccionada.`,
        });
      }
    });

    if (hasInventoryError) {
      return;
    }

    await createSalesOrderMutation.mutateAsync(values);
  });

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={3}
        alignItems={{ xs: "stretch", lg: "flex-start" }}
      >
        <Stack spacing={3} sx={{ flex: 1 }}>
          {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
          {salesContextQuery.isError ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => salesContextQuery.refetch()}>
                  Reintentar
                </Button>
              }
            >
              {salesContextQuery.error.message}
            </Alert>
          ) : null}
          {createSalesOrderMutation.error ? (
            <Alert severity="error">{createSalesOrderMutation.error.message}</Alert>
          ) : null}

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Datos de la venta</Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <CustomFormLabel htmlFor="sales-location">Ubicacion</CustomFormLabel>
                    <Controller
                      name="locationId"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          id="sales-location"
                          select
                          fullWidth
                          size="small"
                          disabled={salesContextQuery.isLoading}
                          error={Boolean(errors.locationId)}
                          helperText={errors.locationId?.message}
                        >
                          {(salesContextQuery.data?.locations ?? []).map((location) => (
                            <MenuItem key={location.id} value={location.id}>
                              {location.name} ({location.code})
                            </MenuItem>
                          ))}
                        </CustomTextField>
                      )}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <CustomFormLabel htmlFor="sales-payment-method">Metodo de pago</CustomFormLabel>
                    <Controller
                      name="paymentMethod"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          id="sales-payment-method"
                          select
                          fullWidth
                          size="small"
                          error={Boolean(errors.paymentMethod)}
                          helperText={errors.paymentMethod?.message}
                        >
                          <MenuItem value="cash">Efectivo</MenuItem>
                          <MenuItem value="card">Tarjeta</MenuItem>
                          <MenuItem value="transfer">Transferencia</MenuItem>
                        </CustomTextField>
                      )}
                    />
                  </Box>
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <CustomFormLabel htmlFor="sales-notes">Notas</CustomFormLabel>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          id="sales-notes"
                          fullWidth
                          size="small"
                          multiline
                          minRows={3}
                          error={Boolean(errors.notes)}
                          helperText={errors.notes?.message ?? "Cliente final sin registro. customer_id se envia en null."}
                        />
                      )}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <CustomFormLabel htmlFor="sales-discount">Descuento global (centavos)</CustomFormLabel>
                    <Controller
                      name="discountCents"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          id="sales-discount"
                          type="number"
                          fullWidth
                          size="small"
                          error={Boolean(errors.discountCents)}
                          helperText={errors.discountCents?.message}
                        />
                      )}
                    />
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Box>
                    <Typography variant="h6">Agregar variantes</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Las ventas se registran por `variant_id` y validan existencias reales por ubicacion.
                    </Typography>
                  </Box>
                  <Autocomplete
                    sx={{ minWidth: { xs: "100%", md: 360 } }}
                    options={variantOptions.filter((variant) => !selectedVariantIds.has(variant.id))}
                    loading={salesContextQuery.isLoading}
                    getOptionLabel={(option) => `${option.productName} - ${option.variantName} (${option.sku})`}
                    onChange={(_, value) => {
                      if (!value) {
                        return;
                      }

                      append({
                        variantId: value.id,
                        quantity: 1,
                        unitPriceCents: value.priceCents,
                        discountCents: 0,
                      });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar variante"
                        helperText={locationId ? "Solo variantes activas y vendibles." : "Selecciona primero una ubicacion."}
                      />
                    )}
                    disabled={!locationId || salesContextQuery.isLoading}
                  />
                </Stack>

                {typeof errors.items?.message === "string" ? (
                  <Alert severity="error">{errors.items.message}</Alert>
                ) : null}

                {fields.length === 0 ? (
                  <Alert severity="info">Aun no agregas variantes al carrito.</Alert>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Variante</TableCell>
                        <TableCell>Disponibles</TableCell>
                        <TableCell>Precio</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Descuento</TableCell>
                        <TableCell>Subtotal</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.map((field, index) => {
                        const variant = variantOptions.find((entry) => entry.id === items[index]?.variantId);
                        const availableQty = variant
                          ? variant.trackInventory
                            ? variant.availableQtyByLocation[locationId] ?? 0
                            : Number.POSITIVE_INFINITY
                          : 0;
                        const lineSubtotal =
                          items[index]?.quantity * items[index]?.unitPriceCents - (items[index]?.discountCents ?? 0);

                        return (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography variant="subtitle2">
                                  {variant?.productName ?? "Variante no encontrada"}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {variant?.variantName} · SKU {variant?.sku}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              {variant?.trackInventory ? (
                                <Chip
                                  size="small"
                                  color={availableQty > 0 ? "success" : "error"}
                                  label={`${availableQty} disp.`}
                                />
                              ) : (
                                <Chip size="small" label="Sin control" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`items.${index}.unitPriceCents`}
                                control={control}
                                render={({ field: priceField }) => (
                                  <CustomTextField
                                    {...priceField}
                                    type="number"
                                    size="small"
                                    sx={{ width: 130 }}
                                    error={Boolean(errors.items?.[index]?.unitPriceCents)}
                                    helperText={errors.items?.[index]?.unitPriceCents?.message}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`items.${index}.quantity`}
                                control={control}
                                render={({ field: quantityField }) => (
                                  <CustomTextField
                                    {...quantityField}
                                    type="number"
                                    size="small"
                                    sx={{ width: 110 }}
                                    error={Boolean(errors.items?.[index]?.quantity)}
                                    helperText={errors.items?.[index]?.quantity?.message}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`items.${index}.discountCents`}
                                control={control}
                                render={({ field: discountField }) => (
                                  <CustomTextField
                                    {...discountField}
                                    type="number"
                                    size="small"
                                    sx={{ width: 120 }}
                                    error={Boolean(errors.items?.[index]?.discountCents)}
                                    helperText={errors.items?.[index]?.discountCents?.message}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight={700}>{formatCurrency(lineSubtotal || 0)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton color="error" onClick={() => remove(index)}>
                                <IconTrash size={18} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                <Button
                  variant="outlined"
                  startIcon={<IconPlus size={18} />}
                  onClick={() => {
                    const nextVariant = variantOptions.find((variant) => !selectedVariantIds.has(variant.id));

                    if (!nextVariant) {
                      return;
                    }

                    append({
                      variantId: nextVariant.id,
                      quantity: 1,
                      unitPriceCents: nextVariant.priceCents,
                      discountCents: 0,
                    });
                  }}
                  disabled={!locationId || variantOptions.length === fields.length}
                >
                  Agregar siguiente variante disponible
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Card variant="outlined" sx={{ width: { xs: "100%", lg: 360 }, position: { lg: "sticky" }, top: { lg: 96 } }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Resumen</Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="textSecondary">Subtotal</Typography>
                  <Typography>{formatCurrency(totals.subtotal)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="textSecondary">Desc. items</Typography>
                  <Typography>{formatCurrency(totals.itemsDiscount)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="textSecondary">Desc. orden</Typography>
                  <Typography>{formatCurrency(orderDiscountCents || 0)}</Typography>
                </Stack>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Total</Typography>
                <Typography variant="h5">{formatCurrency(totals.total)}</Typography>
              </Stack>
              <Button
                variant="contained"
                size="large"
                onClick={onSubmit}
                disabled={createSalesOrderMutation.isPending || salesContextQuery.isLoading || fields.length === 0}
              >
                {createSalesOrderMutation.isPending ? "Confirmando venta..." : "Confirmar venta"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
