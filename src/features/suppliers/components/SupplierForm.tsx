"use client";

import { useEffect } from "react";
import { Alert, Box, Button, FormControlLabel, Stack, Typography } from "@mui/material";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from "@/features/suppliers/suppliers.mutations";
import {
  createSupplierSchema,
  type CreateSupplierInput,
} from "@/features/suppliers/schemas";
import type { SupplierListItem } from "@/features/suppliers/suppliers.types";

interface SupplierFormProps {
  mode?: "create" | "edit";
  supplier?: SupplierListItem | null;
  onCompleted: (message: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  hideIntro?: boolean;
}

const defaultValues: CreateSupplierInput = {
  name: "",
  email: "",
  phone: "",
  taxId: "",
  paymentTermsDays: 0,
  isActive: true,
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  },
};

function getFormValues(supplier?: SupplierListItem | null): CreateSupplierInput {
  if (!supplier) {
    return defaultValues;
  }

  return {
    name: supplier.name,
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    taxId: supplier.taxId ?? "",
    paymentTermsDays: supplier.paymentTermsDays,
    isActive: supplier.isActive,
    address: {
      line1: supplier.address.line1,
      line2: supplier.address.line2,
      city: supplier.address.city,
      state: supplier.address.state,
      postalCode: supplier.address.postalCode,
      country: supplier.address.country,
    },
  };
}

export function SupplierForm({
  mode = "create",
  supplier = null,
  onCompleted,
  onCancel,
  submitLabel,
  hideIntro = false,
}: SupplierFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema) as Resolver<CreateSupplierInput>,
    defaultValues,
  });

  const createSupplierMutation = useCreateSupplierMutation({
    onSuccess: (result) => {
      reset(defaultValues);
      onCompleted(result.message);
    },
  });

  const updateSupplierMutation = useUpdateSupplierMutation({
    onSuccess: (result) => {
      onCompleted(result.message);
    },
  });

  useEffect(() => {
    reset(getFormValues(supplier));
  }, [supplier, reset]);

  const isPending = createSupplierMutation.isPending || updateSupplierMutation.isPending;
  const errorMessage = createSupplierMutation.error?.message ?? updateSupplierMutation.error?.message ?? null;

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "edit" && supplier) {
      await updateSupplierMutation.mutateAsync({
        id: supplier.id,
        ...values,
      });
      return;
    }

    await createSupplierMutation.mutateAsync(values);
  });

  const handleCancel = () => {
    createSupplierMutation.reset();
    updateSupplierMutation.reset();
    reset(getFormValues(supplier));
    onCancel?.();
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack spacing={2.5}>
        {!hideIntro ? (
          <Typography variant="body2" color="textSecondary">
            {mode === "edit"
              ? "Actualiza las condiciones comerciales del proveedor y mantén sus compras asociadas en el mismo expediente."
              : "Registra proveedores para que los ingresos de inventario queden asociados y auditables desde la recepción."}
          </Typography>
        ) : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Box>
          <CustomFormLabel htmlFor="supplier-name">Nombre</CustomFormLabel>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <CustomTextField {...field} id="supplier-name" fullWidth error={Boolean(errors.name)} helperText={errors.name?.message} />
            )}
          />
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <CustomFormLabel htmlFor="supplier-email">Correo</CustomFormLabel>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <CustomTextField {...field} id="supplier-email" fullWidth error={Boolean(errors.email)} helperText={errors.email?.message ?? "Opcional."} />
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <CustomFormLabel htmlFor="supplier-phone">Telefono</CustomFormLabel>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <CustomTextField {...field} id="supplier-phone" fullWidth error={Boolean(errors.phone)} helperText={errors.phone?.message ?? "Opcional."} />
              )}
            />
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <CustomFormLabel htmlFor="supplier-tax-id">Identificador fiscal</CustomFormLabel>
            <Controller
              name="taxId"
              control={control}
              render={({ field }) => (
                <CustomTextField {...field} id="supplier-tax-id" fullWidth error={Boolean(errors.taxId)} helperText={errors.taxId?.message ?? "Opcional."} />
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <CustomFormLabel htmlFor="supplier-payment-terms">Dias de credito</CustomFormLabel>
            <Controller
              name="paymentTermsDays"
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  id="supplier-payment-terms"
                  type="number"
                  fullWidth
                  error={Boolean(errors.paymentTermsDays)}
                  helperText={errors.paymentTermsDays?.message}
                />
              )}
            />
          </Box>
        </Stack>

        <Typography variant="subtitle1" fontWeight={700}>Direccion</Typography>

        <Box>
          <CustomFormLabel htmlFor="supplier-line1">Direccion principal</CustomFormLabel>
          <Controller
            name="address.line1"
            control={control}
            render={({ field }) => (
              <CustomTextField {...field} id="supplier-line1" fullWidth error={Boolean(errors.address?.line1)} helperText={errors.address?.line1?.message ?? "Opcional."} />
            )}
          />
        </Box>

        <Box>
          <CustomFormLabel htmlFor="supplier-line2">Direccion secundaria</CustomFormLabel>
          <Controller
            name="address.line2"
            control={control}
            render={({ field }) => (
              <CustomTextField {...field} id="supplier-line2" fullWidth error={Boolean(errors.address?.line2)} helperText={errors.address?.line2?.message ?? "Opcional."} />
            )}
          />
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <CustomFormLabel htmlFor="supplier-city">Ciudad</CustomFormLabel>
            <Controller
              name="address.city"
              control={control}
              render={({ field }) => (
                <CustomTextField {...field} id="supplier-city" fullWidth error={Boolean(errors.address?.city)} helperText={errors.address?.city?.message ?? "Opcional."} />
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <CustomFormLabel htmlFor="supplier-state">Estado</CustomFormLabel>
            <Controller
              name="address.state"
              control={control}
              render={({ field }) => (
                <CustomTextField {...field} id="supplier-state" fullWidth error={Boolean(errors.address?.state)} helperText={errors.address?.state?.message ?? "Opcional."} />
              )}
            />
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <CustomFormLabel htmlFor="supplier-postal-code">Codigo postal</CustomFormLabel>
            <Controller
              name="address.postalCode"
              control={control}
              render={({ field }) => (
                <CustomTextField {...field} id="supplier-postal-code" fullWidth error={Boolean(errors.address?.postalCode)} helperText={errors.address?.postalCode?.message ?? "Opcional."} />
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <CustomFormLabel htmlFor="supplier-country">Pais</CustomFormLabel>
            <Controller
              name="address.country"
              control={control}
              render={({ field }) => (
                <CustomTextField {...field} id="supplier-country" fullWidth error={Boolean(errors.address?.country)} helperText={errors.address?.country?.message ?? "Opcional."} />
              )}
            />
          </Box>
        </Stack>

        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<CustomCheckbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />}
              label="Proveedor activo"
            />
          )}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
          {onCancel ? <Button color="inherit" onClick={handleCancel}>Cancelar</Button> : null}
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Guardando..." : submitLabel ?? (mode === "edit" ? "Guardar cambios" : "Crear proveedor")}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
