"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconChevronDown, IconPhoto, IconPlus, IconTrash, IconUpload, IconX } from "@tabler/icons-react";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import {
  uploadProductImage,
} from "@/features/catalog/catalog.api";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/features/catalog/catalog.mutations";
import type {
  CategoryOption,
  InventoryLocationOption,
  ProductListItem,
  ProductVariantListItem,
} from "@/features/catalog/catalog.types";
import {
  productDialogSchema,
  type CreateProductInput,
  type ProductDialogValues,
  type ProductVariantInput,
} from "@/features/catalog/schemas";
import { ResponsiveDrawer } from "@/app/components/ui-components/drawer/ResponsiveDrawer";

interface ProductCreateDialogProps {
  open: boolean;
  categories: CategoryOption[];
  inventoryLocations: InventoryLocationOption[];
  onClose: () => void;
  onCompleted: (message: string) => void;
  mode?: "create" | "edit";
  product?: ProductListItem | null;
}

type ProductFormValues = Omit<ProductDialogValues, "categoryIds"> & {
  categoryIds?: string[];
};

function createEmptyVariant(index = 0): ProductVariantInput {
  return {
    name: index === 0 ? "Variante principal" : `Variante ${index + 1}`,
    sku: "",
    barcode: "",
    priceCents: 0,
    compareAtPriceCents: null,
    costCents: 0,
    isDefault: index === 0,
    isActive: true,
    optionValues: [],
    unitValue: null,
    unitLabel: "",
    packSize: null,
    volumeMl: null,
    abv: null,
    initialStockQty: 0,
  };
}

function mapVariantToFormValues(variant: ProductVariantListItem): ProductVariantInput {
  const optionValues = Array.isArray(variant.optionValues)
    ? variant.optionValues.flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }

        const record = entry as Record<string, unknown>;
        const key = typeof record.key === "string" ? record.key : "";
        const value = typeof record.value === "string" ? record.value : "";

        if (!key || !value) {
          return [];
        }

        return [{ key, value }];
      })
    : [];

  return {
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    barcode: variant.barcode ?? "",
    priceCents: variant.priceCents,
    compareAtPriceCents: variant.compareAtPriceCents,
    costCents: variant.costCents,
    isDefault: variant.isDefault,
    isActive: variant.isActive,
    optionValues,
    unitValue: variant.unitValue,
    unitLabel: variant.unitLabel ?? "",
    packSize: variant.packSize,
    volumeMl: variant.volumeMl,
    abv: variant.abv,
    initialStockQty: 0,
  };
}

function getVariantInventorySummary(variant?: ProductVariantListItem) {
  const balances = variant?.inventoryBalances ?? [];
  const totalAvailable = balances.reduce((accumulator, balance) => accumulator + balance.availableQty, 0);

  return {
    balances,
    totalAvailable,
  };
}

const defaultValues: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  status: "draft",
  productType: "simple",
  trackInventory: true,
  isSellable: true,
  isPurchasable: true,
  baseUnit: "unit",
  imageUrl: "",
  initialLocationId: null,
  imageFile: null,
  categoryIds: [],
  variants: [createEmptyVariant()],
};

function getDefaultValues(product?: ProductListItem | null): ProductFormValues {
  if (!product) {
    return defaultValues;
  }

  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description ?? "",
    status: product.status as CreateProductInput["status"],
    productType: product.productType as CreateProductInput["productType"],
    trackInventory: product.trackInventory,
    isSellable: product.isSellable,
    isPurchasable: product.isPurchasable,
    baseUnit: product.baseUnit,
    imageUrl: product.imageUrl ?? "",
    initialLocationId: null,
    imageFile: null,
    categoryIds: product.categories.map((category) => category.id),
    variants:
      product.variants.length > 0
        ? product.variants.map(mapVariantToFormValues)
        : [
            {
              ...createEmptyVariant(),
              name: product.name,
              sku: product.sku,
            },
          ],
  };
}

export function ProductCreateDialog({
  open,
  categories,
  inventoryLocations,
  onClose,
  onCompleted,
  mode = "create",
  product = null,
}: ProductCreateDialogProps) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<ProductFormValues, unknown, ProductDialogValues>({
    resolver: zodResolver(productDialogSchema) as Resolver<
      ProductFormValues,
      unknown,
      ProductDialogValues
    >,
    defaultValues,
  });
  const { fields, append, remove, replace, update } = useFieldArray({
    control,
    name: "variants",
  });
  const selectedImageFile = watch("imageFile");
  const currentImageUrl = watch("imageUrl");
  const productType = watch("productType");
  const productName = watch("name");
  const productSku = watch("sku");
  const trackInventory = watch("trackInventory");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const createProductMutation = useCreateProductMutation({
    onSuccess: (result) => {
      setServerMessage(result.message);
      onCompleted(result.message);
      reset(defaultValues);
      onClose();
    },
  });

  const updateProductMutation = useUpdateProductMutation({
    onSuccess: (result) => {
      setServerMessage(result.message);
      onCompleted(result.message);
      reset(defaultValues);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setLocalErrorMessage(null);
    setServerMessage(null);
    reset(getDefaultValues(product));
  }, [mode, open, product, reset]);

  useEffect(() => {
    const currentVariants = getValues("variants");

    if (productType === "simple" && currentVariants.length !== 1) {
      const primaryVariant =
        currentVariants.find((variant) => variant.isDefault) ??
        currentVariants[0] ??
        createEmptyVariant();
      replace([{ ...primaryVariant, isDefault: true }]);
    }
  }, [getValues, productType, replace]);

  useEffect(() => {
    if (productType !== "simple") {
      return;
    }

    const currentVariant = getValues("variants.0");

    if (!currentVariant) {
      replace([
        {
          ...createEmptyVariant(),
          isDefault: true,
        },
      ]);
      return;
    }

    update(0, {
      ...currentVariant,
      name: currentVariant.name || productName || "Variante principal",
      sku: currentVariant.sku || productSku,
      isDefault: true,
      isActive: true,
    });
  }, [getValues, productName, productSku, productType, replace, update]);

  useEffect(() => {
    if (selectedImageFile instanceof File) {
      const objectUrl = URL.createObjectURL(selectedImageFile);
      setImagePreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    setImagePreviewUrl(currentImageUrl || null);
    return undefined;
  }, [currentImageUrl, selectedImageFile]);

  const isPending = createProductMutation.isPending || updateProductMutation.isPending;

  const handleDialogClose = () => {
    setServerMessage(null);
    clearErrors();
    setLocalErrorMessage(null);
    createProductMutation.reset();
    updateProductMutation.reset();
    reset(defaultValues);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    setLocalErrorMessage(null);

    try {
      let resolvedImageUrl = values.imageUrl;

      if (values.imageFile instanceof File) {
        const uploadResult = await uploadProductImage(values.imageFile, values.slug);
        resolvedImageUrl = uploadResult.publicUrl;
      }

      const payload: CreateProductInput = {
        name: values.name,
        slug: values.slug,
        sku: values.sku,
        description: values.description,
        status: values.status,
        productType: values.productType,
        trackInventory: values.trackInventory,
        isSellable: values.isSellable,
        isPurchasable: values.isPurchasable,
        baseUnit: values.baseUnit,
        imageUrl: resolvedImageUrl,
        initialLocationId: values.initialLocationId,
        categoryIds: values.categoryIds,
        variants: values.variants.map((variant, index) => ({
          ...variant,
          isDefault: variant.isDefault,
          optionValues: variant.optionValues
            .filter((entry) => entry.key.trim() && entry.value.trim())
            .map((entry) => ({
              key: entry.key.trim(),
              value: entry.value.trim(),
            })),
          barcode: variant.barcode?.trim() || undefined,
          unitLabel: variant.unitLabel?.trim() || undefined,
        })),
      };

      if (mode === "edit" && product) {
        await updateProductMutation.mutateAsync({
          id: product.id,
          ...payload,
        });
        return;
      }

      await createProductMutation.mutateAsync(payload);
    } catch (error) {
      setLocalErrorMessage(
        error instanceof Error ? error.message : "No se pudo guardar el producto.",
      );
    }
  });

  return (
    <ResponsiveDrawer
      open={open}
      onClose={handleDialogClose}
    >
      <DialogTitle>{mode === "edit" ? "Editar producto" : "Nuevo producto"}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            {serverMessage ? <Alert severity="success">{serverMessage}</Alert> : null}
            {localErrorMessage ? <Alert severity="error">{localErrorMessage}</Alert> : null}
            {createProductMutation.error ? (
              <Alert severity="error">{createProductMutation.error.message}</Alert>
            ) : null}
            {updateProductMutation.error ? (
              <Alert severity="error">{updateProductMutation.error.message}</Alert>
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="product-name">Nombre</CustomFormLabel>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="product-name"
                      fullWidth
                      size="small"
                      error={Boolean(errors.name)}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="product-sku">SKU</CustomFormLabel>
                <Controller
                  name="sku"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="product-sku"
                      fullWidth
                      size="small"
                      error={Boolean(errors.sku)}
                      helperText={errors.sku?.message}
                    />
                  )}
                />
              </Box>
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Box>
                  <Typography variant="h6">
                    {productType === "simple" ? "Configuracion de la variante" : "Variantes"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {productType === "simple"
                      ? "El producto simple genera automaticamente una sola variante vendible e inventariable."
                      : "Cada variante conserva su propio SKU, precio e inventario por ubicacion."}
                  </Typography>
                </Box>
                {productType === "variant_parent" ? (
                  <Button
                    variant="outlined"
                    startIcon={<IconPlus size={18} />}
                    onClick={() => append(createEmptyVariant(fields.length))}
                  >
                    Agregar variante
                  </Button>
                ) : null}
              </Stack>

              {typeof errors.variants?.message === "string" ? (
                <Alert severity="error">{errors.variants.message}</Alert>
              ) : null}

              {fields.map((field, index) => {
                const variantErrors = errors.variants?.[index];
                const variantId = getValues(`variants.${index}.id`);
                const variantData = product?.variants.find((variant) => variant.id === variantId) ?? product?.variants[index];
                const inventorySummary = getVariantInventorySummary(variantData);

                const variantFields = (
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <CustomFormLabel htmlFor={`product-variant-name-${index}`}>Nombre</CustomFormLabel>
                        <Controller
                          name={`variants.${index}.name`}
                          control={control}
                          render={({ field: variantField }) => (
                            <CustomTextField
                              {...variantField}
                              id={`product-variant-name-${index}`}
                              fullWidth
                              size="small"
                              error={Boolean(variantErrors?.name)}
                              helperText={variantErrors?.name?.message ?? (productType === "simple" ? "Se autocompleta desde el producto si lo dejas vacio." : undefined)}
                            />
                          )}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <CustomFormLabel htmlFor={`product-variant-sku-${index}`}>SKU</CustomFormLabel>
                        <Controller
                          name={`variants.${index}.sku`}
                          control={control}
                          render={({ field: variantField }) => (
                            <CustomTextField
                              {...variantField}
                              id={`product-variant-sku-${index}`}
                              fullWidth
                              size="small"
                              error={Boolean(variantErrors?.sku)}
                              helperText={variantErrors?.sku?.message ?? (productType === "simple" ? "Se precarga con el SKU del producto, pero puedes ajustarlo." : undefined)}
                            />
                          )}
                        />
                      </Box>
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <CustomFormLabel htmlFor={`product-variant-price-${index}`}>Precio venta (centavos)</CustomFormLabel>
                        <Controller
                          name={`variants.${index}.priceCents`}
                          control={control}
                          render={({ field: variantField }) => (
                            <CustomTextField
                              {...variantField}
                              id={`product-variant-price-${index}`}
                              type="number"
                              fullWidth
                              size="small"
                              error={Boolean(variantErrors?.priceCents)}
                              helperText={variantErrors?.priceCents?.message}
                            />
                          )}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <CustomFormLabel htmlFor={`product-variant-cost-${index}`}>Costo (centavos)</CustomFormLabel>
                        <Controller
                          name={`variants.${index}.costCents`}
                          control={control}
                          render={({ field: variantField }) => (
                            <CustomTextField
                              {...variantField}
                              id={`product-variant-cost-${index}`}
                              type="number"
                              fullWidth
                              size="small"
                              error={Boolean(variantErrors?.costCents)}
                              helperText={variantErrors?.costCents?.message}
                            />
                          )}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <CustomFormLabel htmlFor={`product-variant-initial-stock-${index}`}>Stock inicial</CustomFormLabel>
                        <Controller
                          name={`variants.${index}.initialStockQty`}
                          control={control}
                          render={({ field: variantField }) => (
                            <CustomTextField
                              {...variantField}
                              id={`product-variant-initial-stock-${index}`}
                              type="number"
                              fullWidth
                              size="small"
                              disabled={!trackInventory}
                              error={Boolean(variantErrors?.initialStockQty)}
                              helperText={
                                variantErrors?.initialStockQty?.message ??
                                (trackInventory
                                  ? "Existencia inicial para la ubicacion seleccionada."
                                  : "No aplica si el producto no controla inventario.")
                              }
                            />
                          )}
                        />
                      </Box>
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <CustomFormLabel htmlFor={`product-variant-barcode-${index}`}>Codigo de barras</CustomFormLabel>
                        <Controller
                          name={`variants.${index}.barcode`}
                          control={control}
                          render={({ field: variantField }) => (
                            <CustomTextField
                              {...variantField}
                              id={`product-variant-barcode-${index}`}
                              fullWidth
                              size="small"
                              error={Boolean(variantErrors?.barcode)}
                              helperText={variantErrors?.barcode?.message ?? "Opcional"}
                            />
                          )}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <CustomFormLabel htmlFor={`product-variant-unit-label-${index}`}>Etiqueta de unidad</CustomFormLabel>
                        <Controller
                          name={`variants.${index}.unitLabel`}
                          control={control}
                          render={({ field: variantField }) => (
                            <CustomTextField
                              {...variantField}
                              id={`product-variant-unit-label-${index}`}
                              fullWidth
                              size="small"
                              error={Boolean(variantErrors?.unitLabel)}
                              helperText={variantErrors?.unitLabel?.message ?? "Opcional"}
                            />
                          )}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <CustomFormLabel htmlFor={`product-variant-unit-value-${index}`}>Valor unidad</CustomFormLabel>
                        <Controller
                          name={`variants.${index}.unitValue`}
                          control={control}
                          render={({ field: variantField }) => (
                            <CustomTextField
                              {...variantField}
                              id={`product-variant-unit-value-${index}`}
                              type="number"
                              fullWidth
                              size="small"
                              value={variantField.value ?? ""}
                              onChange={(event) => variantField.onChange(event.target.value === "" ? null : event.target.value)}
                              error={Boolean(variantErrors?.unitValue)}
                              helperText={variantErrors?.unitValue?.message ?? "Opcional"}
                            />
                          )}
                        />
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {productType === "variant_parent" ? (
                        <Controller
                          name={`variants.${index}.isDefault`}
                          control={control}
                          render={({ field: variantField }) => (
                            <FormControlLabel
                              control={
                                <CustomCheckbox
                                  checked={variantField.value}
                                  onChange={(event) => {
                                    if (!event.target.checked) {
                                      return;
                                    }

                                    const currentVariants = getValues("variants");
                                    currentVariants.forEach((variant, variantIndex) => {
                                      update(variantIndex, {
                                        ...variant,
                                        isDefault: variantIndex === index,
                                      });
                                    });
                                  }}
                                />
                              }
                              label="Variante principal"
                            />
                          )}
                        />
                      ) : null}
                      <Controller
                        name={`variants.${index}.isActive`}
                        control={control}
                        render={({ field: variantField }) => (
                          <FormControlLabel
                            control={
                              <CustomCheckbox
                                checked={variantField.value}
                                onChange={(event) => variantField.onChange(event.target.checked)}
                              />
                            }
                            label="Variante activa"
                          />
                        )}
                      />
                    </Stack>

                    {mode === "edit" ? (
                      <Box
                        sx={{
                          border: (theme) => `1px dashed ${theme.palette.divider}`,
                          borderRadius: 2,
                          p: 2,
                          bgcolor: "grey.50",
                        }}
                      >
                        <Stack spacing={1.5}>
                          <Typography variant="subtitle2">Inventario actual</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Solo informativo. El inventario se modifica con movimientos, no desde este formulario.
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            Disponible total: {inventorySummary.totalAvailable}
                          </Typography>
                          {inventorySummary.balances.length > 0 ? (
                            <Stack spacing={1}>
                              {inventorySummary.balances.map((balance) => (
                                <Box
                                  key={`${field.id}-${balance.locationId}`}
                                  sx={{
                                    border: (theme) => `1px solid ${theme.palette.divider}`,
                                    borderRadius: 1.5,
                                    p: 1.5,
                                    bgcolor: "background.paper",
                                  }}
                                >
                                  <Typography variant="subtitle2">
                                    {balance.locationName} ({balance.locationCode})
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    En mano: {balance.onHandQty} · Reservado: {balance.reservedQty} · Disponible: {balance.availableQty}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Alert severity="info">No hay existencias registradas para esta variante.</Alert>
                          )}
                        </Stack>
                      </Box>
                    ) : null}
                  </Stack>
                );

                if (productType === "simple") {
                  return (
                    <Box
                      key={field.id}
                      sx={{
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Stack spacing={2}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          Variante unica
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Esta variante se crea automaticamente y concentra los campos obligatorios para venta e inventario.
                        </Typography>
                        {variantFields}
                      </Stack>
                    </Box>
                  );
                }

                const variantTitle = watch(`variants.${index}.name`) || `Variante ${index + 1}`;
                const variantSku = watch(`variants.${index}.sku`) || "Sin SKU";
                const variantPrice = watch(`variants.${index}.priceCents`) || 0;

                return (
                  <Accordion key={field.id} defaultExpanded={index === 0} disableGutters>
                    <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                        sx={{ width: "100%", pr: 2 }}
                      >
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {variantTitle}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            SKU {variantSku} · Precio {variantPrice} centavos
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {watch(`variants.${index}.isDefault`) ? (
                            <Typography variant="caption" color="primary.main" fontWeight={700}>
                              Principal
                            </Typography>
                          ) : null}
                          {fields.length > 1 ? (
                            <IconButton
                              aria-label={`Eliminar variante ${index + 1}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                remove(index);
                              }}
                              color="error"
                            >
                              <IconTrash size={18} />
                            </IconButton>
                          ) : null}
                        </Stack>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>{variantFields}</AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="product-slug">Slug</CustomFormLabel>
                <Controller
                  name="slug"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="product-slug"
                      fullWidth
                      size="small"
                      error={Boolean(errors.slug)}
                      helperText={errors.slug?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="product-base-unit">Unidad base</CustomFormLabel>
                <Controller
                  name="baseUnit"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="product-base-unit"
                      fullWidth
                      size="small"
                      error={Boolean(errors.baseUnit)}
                      helperText={errors.baseUnit?.message}
                    />
                  )}
                />
              </Box>
            </Stack>

            <Box>
              <CustomFormLabel htmlFor="product-description">Descripcion</CustomFormLabel>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="product-description"
                    fullWidth
                    multiline
                    minRows={3}
                    size="small"
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="product-status">Estado</CustomFormLabel>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="product-status"
                      select
                      fullWidth
                      size="small"
                      error={Boolean(errors.status)}
                      helperText={errors.status?.message}
                    >
                      <MenuItem value="draft">Borrador</MenuItem>
                      <MenuItem value="active">Activo</MenuItem>
                      <MenuItem value="archived">Archivado</MenuItem>
                    </CustomTextField>
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="product-type">Tipo de producto</CustomFormLabel>
                <Controller
                  name="productType"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="product-type"
                      select
                      fullWidth
                      size="small"
                      error={Boolean(errors.productType)}
                      helperText={errors.productType?.message}
                    >
                      <MenuItem value="simple">Simple</MenuItem>
                      <MenuItem value="variant_parent">Padre de variantes</MenuItem>
                    </CustomTextField>
                  )}
                />
              </Box>
            </Stack>

            <Box>
              <CustomFormLabel htmlFor="product-initial-location">Ubicacion inicial de inventario</CustomFormLabel>
              <Controller
                name="initialLocationId"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="product-initial-location"
                    select
                    fullWidth
                    size="small"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value || null)}
                    disabled={!watch("trackInventory")}
                    error={Boolean(errors.initialLocationId)}
                    helperText={
                      errors.initialLocationId?.message ??
                      (watch("trackInventory")
                        ? "Se usa para registrar existencias iniciales por variante."
                        : "No aplica cuando el producto no controla inventario.")
                    }
                  >
                    <MenuItem value="">Sin ubicacion</MenuItem>
                    {inventoryLocations.map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name} ({location.code})
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Box>

            <Box>
              <CustomFormLabel>Imagen principal</CustomFormLabel>
              <Controller
                name="imageFile"
                control={control}
                render={({ field }) => (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                      <Avatar
                        src={imagePreviewUrl ?? undefined}
                        variant="rounded"
                        sx={{ width: 84, height: 84, bgcolor: "grey.100", color: "text.secondary" }}
                      >
                        {!imagePreviewUrl ? <IconPhoto size={26} /> : null}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {selectedImageFile instanceof File ? selectedImageFile.name : "Sin imagen seleccionada"}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          PNG, JPG o WEBP.
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button component="label" variant="outlined" startIcon={<IconUpload size={18} />}>
                        {imagePreviewUrl ? "Reemplazar" : "Subir imagen"}
                        <input
                          hidden
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => {
                            const nextFile = event.target.files?.[0] ?? null;
                            field.onChange(nextFile);
                          }}
                        />
                      </Button>
                      {imagePreviewUrl ? (
                        <Button
                          color="inherit"
                          onClick={() => {
                            field.onChange(null);
                            setValue("imageUrl", "");
                          }}
                          startIcon={<IconX size={18} />}
                        >
                          Quitar
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                )}
              />
              <Typography variant="caption" color="textSecondary">
                {errors.imageUrl?.message}
              </Typography>
            </Box>

            <Controller
              name="categoryIds"
              control={control}
              render={({ field }) => {
                const selectedCategoryIds = field.value ?? [];
                const selectedCategories = categories.filter((category) =>
                  selectedCategoryIds.includes(category.id),
                );

                return (
                  <Autocomplete
                    multiple
                    options={categories}
                    size="small"
                    value={selectedCategories}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_, values) => field.onChange(values.map((value) => value.id))}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Categorias"
                        error={Boolean(errors.categoryIds)}
                        helperText={errors.categoryIds?.message ?? "Opcional. Puedes dejar este campo vacio."}
                      />
                    )}
                  />
                );
              }}
            />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Controller
                name="trackInventory"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <CustomCheckbox
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Controlar inventario"
                  />
                )}
              />
              <Controller
                name="isSellable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <CustomCheckbox
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Disponible para venta"
                  />
                )}
              />
              <Controller
                name="isPurchasable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <CustomCheckbox
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Disponible para compra"
                  />
                )}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isPending}
          >
            {isPending
              ? mode === "edit"
                ? "Guardando cambios..."
                : "Guardando..."
              : mode === "edit"
                ? "Guardar cambios"
                : "Crear producto"}
          </Button>
        </DialogActions>
      </Box>
    </ResponsiveDrawer>
  );
}
