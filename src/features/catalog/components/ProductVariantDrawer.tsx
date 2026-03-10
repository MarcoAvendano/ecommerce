"use client";

import { useEffect } from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { ResponsiveDrawer } from "@/app/components/ui-components/drawer/ResponsiveDrawer";
import { productVariantDrawerSchema, type ProductVariantDrawerInput } from "@/features/catalog/product-editor.schemas";
import type { ProductOptionGroupItem } from "@/features/catalog/catalog.types";

interface ProductVariantDrawerProps {
  open: boolean;
  optionGroups: ProductOptionGroupItem[];
  value?: ProductVariantDrawerInput | null;
  onClose: () => void;
  onSubmit: (value: ProductVariantDrawerInput) => Promise<void> | void;
  isPending?: boolean;
}

const defaultValues: ProductVariantDrawerInput = {
  name: "",
  sku: "",
  barcode: "",
  priceCents: 0,
  compareAtPriceCents: null,
  costCents: 0,
  initialStockQty: 0,
  isActive: true,
  optionSelections: [],
};

export function ProductVariantDrawer({
  open,
  optionGroups,
  value,
  onClose,
  onSubmit,
  isPending = false,
}: ProductVariantDrawerProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductVariantDrawerInput>({
    resolver: zodResolver(productVariantDrawerSchema) as Resolver<ProductVariantDrawerInput>,
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(value ?? defaultValues);
  }, [open, reset, value]);

  const optionSelections = watch("optionSelections");
  const isExistingVariant = Boolean(value?.id);
  const handleClose = () => {
    if (isPending) {
      return;
    }

    onClose();
  };

  return (
    <ResponsiveDrawer open={open} onClose={handleClose}>
      <DialogTitle>{value ? "Editar variante" : "Agregar variante"}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="variant-name">Nombre</CustomFormLabel>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField {...field} id="variant-name" fullWidth size="small" error={Boolean(errors.name)} helperText={errors.name?.message} />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="variant-sku">SKU</CustomFormLabel>
                <Controller
                  name="sku"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField {...field} id="variant-sku" fullWidth size="small" error={Boolean(errors.sku)} helperText={errors.sku?.message} />
                  )}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="variant-price">Precio</CustomFormLabel>
                <Controller
                  name="priceCents"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField {...field} id="variant-price" type="number" fullWidth size="small" error={Boolean(errors.priceCents)} helperText={errors.priceCents?.message} />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="variant-cost">Costo</CustomFormLabel>
                <Controller
                  name="costCents"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField {...field} id="variant-cost" type="number" fullWidth size="small" error={Boolean(errors.costCents)} helperText={errors.costCents?.message} />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="variant-stock">Stock inicial</CustomFormLabel>
                <Controller
                  name="initialStockQty"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="variant-stock"
                      type="number"
                      fullWidth
                      size="small"
                      disabled={isExistingVariant}
                      error={Boolean(errors.initialStockQty)}
                      helperText={errors.initialStockQty?.message ?? (isExistingVariant ? "El stock inicial solo se puede definir al crear la variante." : undefined)}
                    />
                  )}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="variant-barcode">Codigo de barras</CustomFormLabel>
                <Controller
                  name="barcode"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField {...field} id="variant-barcode" fullWidth size="small" error={Boolean(errors.barcode)} helperText={errors.barcode?.message ?? "Opcional"} />
                  )}
                />
              </Box>
            </Stack>

            {optionGroups.length > 0 ? (
              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={700}>Opciones de la variante</Typography>
                {optionGroups.map((group, index) => {
                  const currentSelection = optionSelections.find((selection) => selection.groupId === group.id);

                  return (
                    <Box key={group.id ?? index}>
                      <CustomFormLabel htmlFor={`variant-option-${group.id ?? index}`}>{group.name}</CustomFormLabel>
                      <CustomTextField
                        id={`variant-option-${group.id ?? index}`}
                        select
                        fullWidth
                        size="small"
                        value={currentSelection?.valueId ?? ""}
                        onChange={(event) => {
                          const nextValue = group.values.find((valueItem) => valueItem.id === event.target.value);
                          const groupId = group.id ?? `group-${index}`;

                          if (!nextValue) {
                            setValue(
                              "optionSelections",
                              optionSelections.filter((selection) => selection.groupId !== groupId),
                              { shouldDirty: true, shouldValidate: true },
                            );
                            return;
                          }

                          setValue(
                            "optionSelections",
                            [
                              ...optionSelections.filter((selection) => selection.groupId !== groupId),
                              {
                                groupId,
                                groupName: group.name,
                                valueId: nextValue.id ?? `${groupId}-${nextValue.value}`,
                                value: nextValue.value,
                              },
                            ],
                            { shouldDirty: true, shouldValidate: true },
                          );
                        }}
                      >
                        <MenuItem value="">Sin seleccionar</MenuItem>
                        {group.values.map((valueItem) => (
                          <MenuItem key={valueItem.id ?? `${group.id ?? index}-${valueItem.value}`} value={valueItem.id ?? `${group.id ?? index}-${valueItem.value}`}>
                            {valueItem.value}
                          </MenuItem>
                        ))}
                      </CustomTextField>
                    </Box>
                  );
                })}
              </Stack>
            ) : null}

            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<CustomCheckbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />}
                  label="Variante activa"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit" disabled={isPending}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar variante"}
          </Button>
        </DialogActions>
      </Box>
    </ResponsiveDrawer>
  );
}
