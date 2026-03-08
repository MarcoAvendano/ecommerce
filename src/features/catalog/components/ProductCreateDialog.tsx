"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
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
  ProductListItem,
} from "@/features/catalog/catalog.types";
import {
  productDialogSchema,
  type CreateProductInput,
  type ProductDialogValues,
} from "@/features/catalog/schemas";

interface ProductCreateDialogProps {
  open: boolean;
  categories: CategoryOption[];
  onClose: () => void;
  onCompleted: (message: string) => void;
  mode?: "create" | "edit";
  product?: ProductListItem | null;
}

type ProductFormValues = Omit<ProductDialogValues, "categoryIds"> & {
  categoryIds?: string[];
};

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
  imageFile: null,
  categoryIds: [],
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
    imageFile: null,
    categoryIds: product.categories.map((category) => category.id),
  };
}

export function ProductCreateDialog({
  open,
  categories,
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues, unknown, ProductDialogValues>({
    resolver: zodResolver(productDialogSchema) as Resolver<
      ProductFormValues,
      unknown,
      ProductDialogValues
    >,
    defaultValues,
  });
  const selectedImageFile = watch("imageFile");
  const currentImageUrl = watch("imageUrl");
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
        categoryIds: values.categoryIds,
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
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="md">
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
                      error={Boolean(errors.sku)}
                      helperText={errors.sku?.message}
                    />
                  )}
                />
              </Box>
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
                          PNG, JPG o WEBP. Se almacenara en Supabase Storage.
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
                {errors.imageUrl?.message ?? "Si ya existe una imagen, se mostrara aqui y podras reemplazarla."}
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
    </Dialog>
  );
}