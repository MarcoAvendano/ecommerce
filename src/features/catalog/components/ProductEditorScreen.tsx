"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Grid,
  FormControlLabel,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPhoto, IconPlus, IconTrash } from "@tabler/icons-react";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { uploadProductImage } from "@/features/catalog/catalog.api";
import { useCreateProductMutation, useUpdateProductMutation } from "@/features/catalog/catalog.mutations";
import { ProductVariantDrawer } from "@/features/catalog/components/ProductVariantDrawer";
import ImageCropModal from "@/app/components/shared/ImageCropModal";
import { productEditorSchema, type ProductVariantDrawerInput } from "@/features/catalog/product-editor.schemas";
import type {
  ProductEditorInitialData,
  ProductEditorValues,
  LocalProductImageItem,
} from "@/features/catalog/product-editor.types";
import { getDefaultValues, mapToPayload } from "../catalog.mappers";
import { formatPrice } from "@/utils/numbers";

interface ProductEditorScreenProps {
  mode: "create" | "edit";
  initialData: ProductEditorInitialData;
}

export function ProductEditorScreen({ mode, initialData }: ProductEditorScreenProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ProductEditorValues>({
    resolver: zodResolver(productEditorSchema) as Resolver<ProductEditorValues>,
    defaultValues: getDefaultValues(initialData),
  });
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const values = watch();

  const createProductMutation = useCreateProductMutation({
    onSuccess: (result) => setMessage(result.message),
  });
  const updateProductMutation = useUpdateProductMutation({
    onSuccess: (result) => setMessage(result.message),
  });

  const currentVariantValue = editingVariantIndex !== null ? (values.variants[editingVariantIndex] ?? null) : null;
  const isPending = isSubmitting || createProductMutation.isPending || updateProductMutation.isPending;
  const preventNavigationWhilePending = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isPending) {
      return;
    }

    event.preventDefault();
  };

  const onSubmit = handleSubmit(async (submittedValues) => {
    setLocalError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      let imageUrl = submittedValues.imageUrl;

      if (submittedValues.imageFile instanceof File) {
        const uploadResult = await uploadProductImage(submittedValues.imageFile, submittedValues.slug);
        imageUrl = uploadResult.publicUrl;
      }

      const payload = mapToPayload({ ...submittedValues, imageUrl });

      if (mode === "edit" && initialData.product) {
        await updateProductMutation.mutateAsync({
          id: initialData.product.id,
          ...payload,
        });
        return;
      }

      await createProductMutation.mutateAsync(payload);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo guardar el producto.");
    } finally {
      setIsSubmitting(false);
    }
  });

  const inventoryByVariant = useMemo(() => {
    return new Map(
      (initialData.product?.variants ?? []).map((variant) => [
        variant.id,
        variant.inventoryBalances.reduce((accumulator, balance) => accumulator + balance.availableQty, 0),
      ])
    );
  }, [initialData.product?.variants]);

  const handleVariantSubmit = (variant: ProductVariantDrawerInput) => {
    const nextVariants = [...values.variants];

    if (editingVariantIndex !== null) {
      nextVariants[editingVariantIndex] = variant;
    } else {
      nextVariants.push(variant);
    }

    setValue("variants", nextVariants, { shouldDirty: true, shouldValidate: true });
    setDrawerOpen(false);
    setEditingVariantIndex(null);
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {localError ? <Alert severity="error">{localError}</Alert> : null}
        {createProductMutation.error ? <Alert severity="error">{createProductMutation.error.message}</Alert> : null}
        {updateProductMutation.error ? <Alert severity="error">{updateProductMutation.error.message}</Alert> : null}

        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} md={9}>
            <Stack spacing={3}>
              <Box sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <CustomFormLabel htmlFor="product-name">Nombre del producto</CustomFormLabel>
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
                      <CustomFormLabel htmlFor="product-sku">SKU base</CustomFormLabel>
                      <Controller
                        name="sku"
                        control={control}
                        render={({ field }) => (
                          <CustomTextField
                            {...field}
                            id="product-sku"
                            fullWidth
                            size="small"
                            helperText="Opcional. Si queda vacio, se deriva del slug."
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
                          minRows={4}
                          size="small"
                          error={Boolean(errors.description)}
                          helperText={errors.description?.message}
                        />
                      )}
                    />
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography variant="h6">Variantes</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Cada producto debe tener al menos una variante. Agregalas y editalas desde el panel lateral.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {mode === "edit" && initialData.product ? (
                        <Button
                          component={Link}
                          href={`/apps/products/${initialData.product.id}/variants`}
                          variant="outlined"
                          size="small"
                          disabled={isPending}
                          onClick={preventNavigationWhilePending}
                        >
                          Gestionar
                        </Button>
                      ) : null}
                      <Button
                        variant="contained"
                        startIcon={<IconPlus size={18} />}
                        size="small"
                        disabled={isPending}
                        onClick={() => {
                          setEditingVariantIndex(null);
                          setDrawerOpen(true);
                        }}
                      >
                        Agregar
                      </Button>
                    </Stack>
                  </Stack>

                  {typeof errors.variants?.message === "string" ? (
                    <Alert severity="error">{errors.variants.message}</Alert>
                  ) : null}

                  <VariantsTable variants={values.variants} inventoryByVariant={inventoryByVariant} />
                </Stack>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={3}>
            <Stack spacing={3}>
              <Box sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Publicacion</Typography>
                  <Box>
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
                </Stack>
              </Box>

              <Box sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Clasificacion</Typography>
                  <Box>
                    <CustomFormLabel htmlFor="product-store">Ubicacion de inventario</CustomFormLabel>
                    <Controller
                      name="storeId"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          id="product-store"
                          select
                          fullWidth
                          size="small"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value || null)}
                          error={Boolean(errors.storeId)}
                          helperText={errors.storeId?.message}
                        >
                          <MenuItem value="">Selecciona una ubicacion</MenuItem>
                          {initialData.bootstrap.stores.map((store) => (
                            <MenuItem key={store.id} value={store.id}>
                              {store.name}
                            </MenuItem>
                          ))}
                        </CustomTextField>
                      )}
                    />
                  </Box>
                  <Controller
                    name="categoryIds"
                    control={control}
                    render={({ field }) => {
                      const selectedCategories = initialData.bootstrap.categories.filter((category) =>
                        field.value.includes(category.id)
                      );

                      return (
                        <Autocomplete
                          multiple
                          options={initialData.bootstrap.categories}
                          value={selectedCategories}
                          getOptionLabel={(option) => option.name}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          onChange={(_, nextValues) => field.onChange(nextValues.map((item) => item.id))}
                          renderInput={(params) => (
                            <CustomTextField {...params} label="Categorias" size="small" helperText="Opcional" />
                          )}
                        />
                      );
                    }}
                  />
                </Stack>
              </Box>

              <Box sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Recursos</Typography>
                  <Stack direction="column" spacing={2} alignItems="start">
                    <Avatar
                      src={
                        values.imageFile instanceof File
                          ? URL.createObjectURL(values.imageFile)
                          : values.imageUrl || undefined
                      }
                      variant="rounded"
                      sx={{ width: 88, height: 88 }}
                    >
                      {!values.imageUrl && !(values.imageFile instanceof File) ? <IconPhoto size={24} /> : null}
                    </Avatar>
                    <Button component="label" variant="outlined" disabled={isPending}>
                      Subir imagen principal
                      <input
                        hidden
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          if (file) {
                            setSelectedImageFile(file);
                            setCropModalOpen(true);
                          }
                          event.target.value = "";
                        }}
                      />
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button
            component={Link}
            href="/apps/products"
            color="inherit"
            disabled={isPending}
            onClick={preventNavigationWhilePending}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Guardando..." : mode === "edit" ? "Actualizar" : "Crear producto"}
          </Button>
        </Stack>
      </Stack>

      <ProductVariantDrawer
        open={drawerOpen}
        optionGroups={values.optionGroups}
        value={currentVariantValue}
        onClose={() => {
          setDrawerOpen(false);
          setEditingVariantIndex(null);
        }}
        onSubmit={handleVariantSubmit}
      />

      <ImageCropModal
        open={cropModalOpen}
        imageFile={selectedImageFile}
        onClose={() => {
          setCropModalOpen(false);
          setSelectedImageFile(null);
        }}
        onCropSave={(croppedFile) => {
          setCropModalOpen(false);
          setSelectedImageFile(null);
          setValue("imageFile", croppedFile, { shouldDirty: true });
        }}
        aspectRatio={1}
      />
    </Box>
  );
}

interface VariantsTableProps {
  variants: ProductVariantDrawerInput[];
  inventoryByVariant: Map<string, number>;
}
function VariantsTable({ variants, inventoryByVariant }: VariantsTableProps) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Variante</TableCell>
          <TableCell>SKU</TableCell>
          <TableCell>Estado</TableCell>
          <TableCell>Precio</TableCell>
          <TableCell>Stock</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {variants.map((variant, index) => (
          <TableRow key={`${variant.sku}-${index}`}>
            <TableCell>{variant.name}</TableCell>
            <TableCell>{variant.sku}</TableCell>
            <TableCell>{variant.isActive ? "Activa" : "Inactiva"}</TableCell>
            <TableCell>{formatPrice(variant.priceCents)}</TableCell>
            <TableCell>{variant.id ? (inventoryByVariant.get(variant.id) ?? 0) : variant.initialStockQty}</TableCell>
          </TableRow>
        ))}
        {variants.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6}>
              <Typography variant="body2" color="textSecondary" sx={{ py: 3, textAlign: "center" }}>
                Aun no agregas variantes.
              </Typography>
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
