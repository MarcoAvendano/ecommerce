"use client";

import { useEffect } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { Controller, useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { ResponsiveDrawer } from "@/app/components/ui-components/drawer/ResponsiveDrawer";
import type { ProductOptionGroupItem } from "@/features/catalog/catalog.types";
import { z } from "zod";
import AlertDialog from "@/app/components/ui-components/dialog/AlertDialog";
import { AddGroupFormValues, addGroupSchema, AddValueFormValues, addValueSchema } from "../schemas";

const addGroupDefaultValues: AddGroupFormValues = {
  name: "",
  values: [{ value: "" }],
};

const addValueDefaultValues: AddValueFormValues = {
  value: "",
};

interface ProductOptionGroupCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: AddGroupFormValues) => Promise<void> | void;
  isPending: boolean;
  errorMessage?: string | null;
}

export function ProductOptionGroupCreateDialog({
  open,
  onClose,
  onSubmit,
  isPending,
  errorMessage,
}: ProductOptionGroupCreateDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddGroupFormValues>({
    resolver: zodResolver(addGroupSchema) as Resolver<AddGroupFormValues>,
    defaultValues: addGroupDefaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "values",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(addGroupDefaultValues);
  }, [open, reset]);

  const handleClose = () => {
    reset(addGroupDefaultValues);
    onClose();
  };

  return (
    <ResponsiveDrawer open={open} onClose={handleClose} sx={{ width: "100%", maxWidth: 520 }}>
      <DialogTitle>Agregar grupo de opciones</DialogTitle>
      <Box
        component="form"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit({
            name: values.name.trim(),
            values: values.values.map((item) => ({ value: item.value.trim() })),
          });
        })}
        noValidate
      >
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <Box>
              <CustomFormLabel htmlFor="option-group-name">Nombre del grupo</CustomFormLabel>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="option-group-name"
                    fullWidth
                    size="small"
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Box>

            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  Opciones
                </Typography>
                <Button
                  type="button"
                  variant="text"
                  startIcon={<IconPlus size={16} />}
                  onClick={() => append({ value: "" })}
                >
                  Agregar opcion
                </Button>
              </Stack>

              {fields.map((field, index) => (
                <Stack key={field.id} direction="row" spacing={1} alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Controller
                      name={`values.${index}.value` as const}
                      control={control}
                      render={({ field: valueField }) => (
                        <CustomTextField
                          {...valueField}
                          fullWidth
                          size="small"
                          placeholder={`Opcion ${index + 1}`}
                          error={Boolean(errors.values?.[index]?.value)}
                          helperText={errors.values?.[index]?.value?.message}
                        />
                      )}
                    />
                  </Box>
                  <Button
                    type="button"
                    color="error"
                    variant="text"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    sx={{ minWidth: "auto", px: 1.5, mt: 0.25 }}
                  >
                    <IconTrash size={18} />
                  </Button>
                </Stack>
              ))}

              {typeof errors.values?.message === "string" ? (
                <Typography variant="caption" color="error.main">
                  {errors.values.message}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit" disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            Crear grupo
          </Button>
        </DialogActions>
      </Box>
    </ResponsiveDrawer>
  );
}

interface ProductOptionGroupValueDialogProps {
  open: boolean;
  group: ProductOptionGroupItem | null;
  onClose: () => void;
  onSubmit: (value: AddValueFormValues) => Promise<void> | void;
  isPending: boolean;
  errorMessage?: string | null;
}

export function ProductOptionGroupValueDialog({
  open,
  group,
  onClose,
  onSubmit,
  isPending,
  errorMessage,
}: ProductOptionGroupValueDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddValueFormValues>({
    resolver: zodResolver(addValueSchema) as Resolver<AddValueFormValues>,
    defaultValues: addValueDefaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(addValueDefaultValues);
  }, [open, reset]);

  const handleClose = () => {
    reset(addValueDefaultValues);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Agregar opcion</DialogTitle>
      <Box
        component="form"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit({ value: values.value.trim() });
        })}
        noValidate
      >
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {group ? (
              <Typography variant="body1" color="text.secondary">
                Grupo: <strong>{group.name}</strong>
              </Typography>
            ) : null}
            <Box>
              <CustomFormLabel htmlFor="option-group-value">Valor de opcion</CustomFormLabel>
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="option-group-value"
                    fullWidth
                    size="small"
                    placeholder="Ej: Rojo, Grande, Cuero, etc."
                    error={Boolean(errors.value)}
                    helperText={errors.value?.message}
                  />
                )}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit" disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            Agregar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

interface ProductOptionGroupDeleteDialogProps {
  open: boolean;
  group: ProductOptionGroupItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isPending: boolean;
  errorMessage?: string | null;
}

export function ProductOptionGroupDeleteDialog({
  open,
  group,
  onClose,
  onConfirm,
  isPending,
  errorMessage,
}: ProductOptionGroupDeleteDialogProps) {
  return (
    <AlertDialog
      open={open}
      onClose={onClose}
      title="Eliminar grupo de opciones"
      onConfirm={onConfirm}
      confirmText="Eliminar grupo"
      isPending={isPending}
      fullWidth
      maxWidth="xs"
    >
      <DialogContent dividers>
        <Stack spacing={2}>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          <Typography variant="body1">
            {group
              ? `Si eliminas el grupo \"${group.name}\", las variantes que tengan valores asignados en este grupo perderan esa relacion.`
              : "Si eliminas este grupo, las variantes que tengan valores asignados perderan esa relacion."}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta accion no edita otros grupos, pero si limpia las selecciones asociadas a este grupo en las variantes
            existentes.
          </Typography>
        </Stack>
      </DialogContent>
    </AlertDialog>
  );
}
