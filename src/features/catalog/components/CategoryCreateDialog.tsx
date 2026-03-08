"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
} from "@mui/material";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/features/catalog/catalog.mutations";
import type { CategoryListItem } from "@/features/catalog/catalog.types";
import {
  createCategorySchema,
  type CreateCategoryInput,
} from "@/features/catalog/schemas";
import { ResponsiveDrawer } from "@/app/components/ui-components/drawer/ResponsiveDrawer";

type CategoryFormValues = Omit<CreateCategoryInput, "sortOrder"> & {
  sortOrder: number | string;
};

interface CategoryCreateDialogProps {
  open: boolean;
  categories: CategoryListItem[];
  onClose: () => void;
  onCompleted: (message: string) => void;
  mode?: "create" | "edit";
  category?: CategoryListItem | null;
}

const defaultValues: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  parentId: null,
  sortOrder: 0,
  isActive: true,
};

function getDefaultValues(category?: CategoryListItem | null): CategoryFormValues {
  if (!category) {
    return defaultValues;
  }

  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    parentId: category.parentId,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };
}

export function CategoryCreateDialog({
  open,
  categories,
  onClose,
  onCompleted,
  mode = "create",
  category = null,
}: CategoryCreateDialogProps) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues, unknown, CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema) as Resolver<
      CategoryFormValues,
      unknown,
      CreateCategoryInput
    >,
    defaultValues,
  });

  const createCategoryMutation = useCreateCategoryMutation({
    onSuccess: (result) => {
      setServerMessage(result.message);
      onCompleted(result.message);
      reset(defaultValues);
      onClose();
    },
  });

  const updateCategoryMutation = useUpdateCategoryMutation({
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

    setServerMessage(null);
    reset(getDefaultValues(category));
  }, [category, open, reset]);

  const isPending = createCategoryMutation.isPending || updateCategoryMutation.isPending;
  const parentOptions = categories.filter((item) => item.id !== category?.id);

  const handleDialogClose = () => {
    setServerMessage(null);
    createCategoryMutation.reset();
    updateCategoryMutation.reset();
    reset(defaultValues);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);

    if (mode === "edit" && category) {
      await updateCategoryMutation.mutateAsync({
        id: category.id,
        ...values,
      });
      return;
    }

    await createCategoryMutation.mutateAsync(values);
  });

  return (
    <ResponsiveDrawer open={open} onClose={handleDialogClose} sx={{width: '100%', maxWidth: 500}}>
      <DialogTitle>{mode === "edit" ? "Editar categoria" : "Nueva categoria"}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate width={'500px'}>
        <DialogContent dividers>
          <Stack spacing={2}>
            {serverMessage ? <Alert severity="success">{serverMessage}</Alert> : null}
            {createCategoryMutation.error ? (
              <Alert severity="error">{createCategoryMutation.error.message}</Alert>
            ) : null}
            {updateCategoryMutation.error ? (
              <Alert severity="error">{updateCategoryMutation.error.message}</Alert>
            ) : null}

            <Box>
              <CustomFormLabel htmlFor="category-name">Nombre</CustomFormLabel>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="category-name"
                    fullWidth
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Box>

            <Box>
              <CustomFormLabel htmlFor="category-slug">Slug</CustomFormLabel>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="category-slug"
                    fullWidth
                    error={Boolean(errors.slug)}
                    helperText={errors.slug?.message}
                  />
                )}
              />
            </Box>

            <Box>
              <CustomFormLabel htmlFor="category-description">Descripcion</CustomFormLabel>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="category-description"
                    fullWidth
                    multiline
                    minRows={3}
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Box>

            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <Box>
                  <CustomFormLabel htmlFor="category-parent">Categoria padre</CustomFormLabel>
                  <CustomTextField
                    id="category-parent"
                    select
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value || null)}
                    error={Boolean(errors.parentId)}
                    helperText={errors.parentId?.message ?? "Opcional para categorias raiz."}
                  >
                    <MenuItem value="">Sin categoria padre</MenuItem>
                    {parentOptions.map((parentOption) => (
                      <MenuItem key={parentOption.id} value={parentOption.id}>
                        {parentOption.name}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                </Box>
              )}
            />

            <Box>
              <CustomFormLabel htmlFor="category-sort-order">Orden</CustomFormLabel>
              <Controller
                name="sortOrder"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    id="category-sort-order"
                    type="number"
                    fullWidth
                    value={field.value}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    error={Boolean(errors.sortOrder)}
                    helperText={errors.sortOrder?.message}
                  />
                )}
              />
            </Box>

            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <CustomCheckbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label="Categoria activa"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending
              ? mode === "edit"
                ? "Guardando cambios..."
                : "Guardando..."
              : mode === "edit"
                ? "Guardar cambios"
                : "Crear categoria"}
          </Button>
        </DialogActions>
      </Box>
    </ResponsiveDrawer>
  );
}