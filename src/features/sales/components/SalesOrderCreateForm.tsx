"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
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
import CustomSwitch from "@/app/components/forms/theme-elements/CustomSwitch";
import { formatSalesCurrency } from "@/features/sales/sales.formatters";
import { useCreateSalesOrderMutation } from "@/features/sales/sales.mutations";
import { useCustomerAddressesQuery, useSalesCreateContextQuery } from "@/features/sales/sales.queries";
import { createSalesOrderSchema, type CreateSalesOrderInput } from "@/features/sales/schemas";

const defaultValues: CreateSalesOrderInput = {
  locationId: "",
  paymentMethod: "cash",
  notes: "",
  discountDollars: 0,
  customerId: null,
  requiresShipping: false,
  shippingAddressId: null,
  items: [],
};

export function SalesOrderCreateForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const salesContextQuery = useSalesCreateContextQuery();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
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
  const orderDiscountDollars = watch("discountDollars");
  const customerId = watch("customerId");
  const requiresShipping = watch("requiresShipping");

  const customerAddressesQuery = useCustomerAddressesQuery(customerId);

  const createSalesOrderMutation = useCreateSalesOrderMutation({
    onSuccess: (result) => {
      setSuccessMessage(`${result.message} Orden ${result.order.orderNumber}.`);
      reset(defaultValues);
    },
  });

  // Auto-select first location when data loads
  useEffect(() => {
    const locations = salesContextQuery.data?.locations;

    if (locations && locations.length > 0 && !locationId) {
      setValue("locationId", locations[0].id);
    }
  }, [salesContextQuery.data?.locations, locationId, setValue]);

  // Clear shipping address when customer changes
  useEffect(() => {
    setValue("shippingAddressId", null);
  }, [customerId, setValue]);

  // Clear shipping fields when shipping is disabled
  useEffect(() => {
    if (!requiresShipping) {
      setValue("shippingAddressId", null);
    }
  }, [requiresShipping, setValue]);

  const variantOptions = salesContextQuery.data?.variants ?? [];
  const customerOptions = salesContextQuery.data?.customers ?? [];
  const selectedVariantIds = new Set(items.map((item) => item.variantId));

  const totals = useMemo(() => {
    const subtotal = items.reduce((accumulator, item) => accumulator + item.quantity * item.unitPriceCents, 0);
    const itemsDiscountCents = items.reduce(
      (accumulator, item) => accumulator + Math.round((item.discountDollars ?? 0) * 100),
      0
    );
    const orderDiscountCents = Math.round((orderDiscountDollars ?? 0) * 100);
    const total = subtotal - itemsDiscountCents - orderDiscountCents;

    return {
      subtotal,
      itemsDiscount: itemsDiscountCents,
      orderDiscount: orderDiscountCents,
      total: Math.max(total, 0),
    };
  }, [items, orderDiscountDollars]);

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage(null);

    let hasInventoryError = false;

    values.items.forEach((item: CreateSalesOrderInput["items"][number], index: number) => {
      const variant = variantOptions.find((entry) => entry.id === item.variantId);

      if (!variant) {
        hasInventoryError = true;
        setError(`items.${index}.variantId`, {
          message: "Selecciona un producto válido.",
        });
        return;
      }

      const availableQty = variant.trackInventory
        ? (variant.availableQtyByLocation[values.locationId] ?? 0)
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

    if (values.requiresShipping && !values.shippingAddressId) {
      setError("shippingAddressId", {
        message: "Selecciona una direccion de envio.",
      });
      return;
    }

    await createSalesOrderMutation.mutateAsync(values);
  });

  const selectedCustomer = customerOptions.find((c) => c.id === customerId);
  const addresses = customerAddressesQuery.data?.addresses ?? [];
  const selectedAddress = addresses.find((a) => a.id === watch("shippingAddressId"));

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={600}>
          Nueva venta
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          {/* Location */}
          <Box>
            <Controller
              name="locationId"
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  id="sales-location"
                  select
                  fullWidth
                  label="Ubicacion"
                  size="medium"
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
          {/* Submit button */}
          <Button
            variant="contained"
            size="large"
            onClick={onSubmit}
            disabled={createSalesOrderMutation.isPending || salesContextQuery.isLoading || fields.length === 0}
          >
            {createSalesOrderMutation.isPending ? "Confirmando venta..." : "Confirmar venta"}
          </Button>
        </Box>
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={3} alignItems={{ xs: "stretch", lg: "flex-start" }}>
        {/* Left panel - Products table + Summary */}
        <Stack spacing={3} sx={{ flex: 3 }}>
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
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Autocomplete
                    sx={{ minWidth: { xs: "100%", md: 360 } }}
                    options={variantOptions.filter((variant) => !selectedVariantIds.has(variant.id))}
                    loading={salesContextQuery.isLoading}
                    getOptionLabel={(option) => `${option.productName} - ${option.variantName} (${option.sku})`}
                    onChange={(event, value) => {
                      if (!value) {
                        return;
                      }

                      append({
                        variantId: value.id,
                        quantity: 1,
                        unitPriceCents: value.priceCents,
                        discountDollars: 0,
                      });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar producto..."
                        helperText={
                          locationId ? "Solo productos activos y vendibles." : "Selecciona primero una ubicacion."
                        }
                      />
                    )}
                    disabled={!locationId || salesContextQuery.isLoading}
                  />
                </Stack>

                {typeof errors.items?.message === "string" ? (
                  <Alert severity="error">{errors.items.message}</Alert>
                ) : null}

                {fields.length === 0 ? (
                  <Alert severity="info">Aun no agregas productos al carrito.</Alert>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Producto</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell>Disponibles</TableCell>
                          <TableCell>Precio unit.</TableCell>
                          <TableCell>Cantidad</TableCell>
                          <TableCell>Descuento ($)</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell align="right" />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fields.map((field, index) => {
                          const variant = variantOptions.find((entry) => entry.id === items[index]?.variantId);
                          const availableQty = variant
                            ? variant.trackInventory
                              ? (variant.availableQtyByLocation[locationId] ?? 0)
                              : Number.POSITIVE_INFINITY
                            : 0;
                          const itemDiscountCents = Math.round((items[index]?.discountDollars ?? 0) * 100);
                          const lineSubtotal =
                            items[index]?.quantity * items[index]?.unitPriceCents - itemDiscountCents;

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Stack spacing={0.5}>
                                  <Typography variant="subtitle2">
                                    {variant?.productName ?? "Variante no encontrada"}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {variant?.variantName}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary">
                                  {variant?.sku ?? "-"}
                                </Typography>
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
                                <Typography variant="body2">
                                  {formatSalesCurrency(items[index]?.unitPriceCents ?? 0)}
                                </Typography>
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
                                      sx={{ width: 90 }}
                                      inputProps={{ min: 1 }}
                                      error={Boolean(errors.items?.[index]?.quantity)}
                                      helperText={errors.items?.[index]?.quantity?.message}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Controller
                                  name={`items.${index}.discountDollars`}
                                  control={control}
                                  render={({ field: discountField }) => (
                                    <CustomTextField
                                      {...discountField}
                                      type="number"
                                      size="small"
                                      sx={{ width: 100 }}
                                      inputProps={{ min: 0, step: "0.01" }}
                                      error={Boolean(errors.items?.[index]?.discountDollars)}
                                      helperText={errors.items?.[index]?.discountDollars?.message}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight={700}>{formatSalesCurrency(lineSubtotal || 0)}</Typography>
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
                  </Box>
                )}

                {fields.length > 0 ? (
                  <>
                    <Divider />
                    <Stack spacing={1} sx={{ px: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="textSecondary">Subtotal</Typography>
                        <Typography>{formatSalesCurrency(totals.subtotal)}</Typography>
                      </Stack>
                      {totals.itemsDiscount > 0 ? (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography color="textSecondary">Desc. productos</Typography>
                          <Typography color="error">-{formatSalesCurrency(totals.itemsDiscount)}</Typography>
                        </Stack>
                      ) : null}
                      {totals.orderDiscount > 0 ? (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography color="textSecondary">Desc. global</Typography>
                          <Typography color="error">-{formatSalesCurrency(totals.orderDiscount)}</Typography>
                        </Stack>
                      ) : null}
                      <Divider />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Total</Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {formatSalesCurrency(totals.total)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </>
                ) : null}
              </Stack>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card variant="outlined">
            <CardContent sx={{ py: 0 }}>
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
                    helperText={errors.notes?.message}
                  />
                )}
              />
            </CardContent>
          </Card>
        </Stack>

        {/* Right panel - Controls */}
        <Stack
          spacing={2}
          sx={{
            width: { xs: "100%", lg: 360 },
            position: { lg: "sticky" },
            top: { lg: 96 },
          }}
        >
          {/* Payment method */}
          <Card variant="outlined">
            <CardContent sx={{ p: 0 }}>
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
            </CardContent>
          </Card>

          {/* Customer */}
          <Card variant="outlined">
            <CardContent sx={{ p: 0 }}>
              <CustomFormLabel>Cliente (opcional)</CustomFormLabel>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={customerOptions}
                    getOptionLabel={(option) => `${option.fullName}${option.email ? ` (${option.email})` : ""}`}
                    value={selectedCustomer ?? null}
                    onChange={(_, value) => {
                      field.onChange(value?.id ?? null);
                    }}
                    loading={salesContextQuery.isLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Buscar cliente..."
                        error={Boolean(errors.customerId)}
                        helperText={errors.customerId?.message ?? "Dejar vacio para cliente final."}
                      />
                    )}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Global discount */}
          <Card variant="outlined">
            <CardContent sx={{ p: 0 }}>
              <CustomFormLabel htmlFor="sales-discount">Descuento global ($)</CustomFormLabel>
              <Controller
                name="discountDollars"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="sales-discount"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ min: 0, step: "0.01" }}
                    error={Boolean(errors.discountDollars)}
                    helperText={errors.discountDollars?.message}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card variant="outlined">
            <CardContent sx={{ p: 0 }}>
              <Stack spacing={1}>
                <Controller
                  name="requiresShipping"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      disabled={!customerId}
                      control={
                        <CustomSwitch
                          checked={field.value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Requiere envio"
                    />
                  )}
                />

                {requiresShipping ? (
                  <>
                    {!customerId ? (
                      <Alert severity="info" variant="outlined">
                        Selecciona un cliente para ver sus direcciones.
                      </Alert>
                    ) : customerAddressesQuery.isLoading ? (
                      <Typography variant="body2" color="textSecondary">
                        Cargando direcciones...
                      </Typography>
                    ) : addresses.length === 0 ? (
                      <Alert severity="warning" variant="outlined">
                        Este cliente no tiene direcciones registradas.
                      </Alert>
                    ) : (
                      <>
                        <CustomFormLabel htmlFor="sales-shipping-address">Direccion de envio</CustomFormLabel>
                        <Controller
                          name="shippingAddressId"
                          control={control}
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              value={field.value ?? ""}
                              id="sales-shipping-address"
                              select
                              fullWidth
                              size="small"
                              error={Boolean(errors.shippingAddressId)}
                              helperText={errors.shippingAddressId?.message}
                            >
                              {addresses.map((address) => (
                                <MenuItem key={address.id} value={address.id}>
                                  {address.label}
                                  {address.isDefault ? " (Principal)" : ""}
                                </MenuItem>
                              ))}
                            </CustomTextField>
                          )}
                        />

                        {selectedAddress ? (
                          <Box
                            sx={{
                              mt: 1,
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: "action.hover",
                            }}
                          >
                            <Typography variant="body2">{selectedAddress.line1}</Typography>
                            {selectedAddress.line2 ? (
                              <Typography variant="body2">{selectedAddress.line2}</Typography>
                            ) : null}
                            <Typography variant="body2">
                              {selectedAddress.city}
                              {selectedAddress.state ? `, ${selectedAddress.state}` : ""}
                            </Typography>
                            {selectedAddress.postalCode ? (
                              <Typography variant="body2">{selectedAddress.postalCode}</Typography>
                            ) : null}
                            <Typography variant="body2" color="textSecondary">
                              {selectedAddress.country}
                            </Typography>
                          </Box>
                        ) : null}
                      </>
                    )}
                  </>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Stack>
  );
}
