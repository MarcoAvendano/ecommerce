"use client";

import { useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { ResponsiveDrawer } from "@/app/components/ui-components/drawer/ResponsiveDrawer";
import {
  useCreateClientAddressMutation,
  useUpdateClientAddressMutation,
} from "@/features/clients/clients.mutations";
import {
  createClientAddressSchema,
  type CreateClientAddressInput,
} from "@/features/clients/schemas";
import type { ClientAddressItem } from "@/features/clients/clients.types";

interface ClientAddressDrawerProps {
  clientId: string;
  open: boolean;
  onClose: () => void;
  onCompleted: (message: string) => void;
  mode?: "create" | "edit";
  address?: ClientAddressItem | null;
}

const defaultValues: Omit<CreateClientAddressInput, "clientId"> = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States of America",
  isDefault: false,
};

export function ClientAddressDrawer({
  clientId,
  open,
  onClose,
  onCompleted,
  mode = "create",
  address = null,
}: ClientAddressDrawerProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Omit<CreateClientAddressInput, "clientId">>({
    resolver: zodResolver(
      createClientAddressSchema.omit({ clientId: true }),
    ),
    defaultValues,
  });

  const createAddressMutation = useCreateClientAddressMutation({
    onSuccess: (result) => {
      onCompleted(result.message);
      onClose();
    },
  });

  const updateAddressMutation = useUpdateClientAddressMutation({
    onSuccess: (result) => {
      onCompleted(result.message);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      address
        ? {
            label: address.label,
            line1: address.line1,
            line2: address.line2 ?? "",
            city: address.city,
            state: address.state ?? "",
            postalCode: address.postalCode ?? "",
            country: address.country,
            isDefault: address.isDefault,
          }
        : defaultValues,
    );
  }, [address, open, reset]);

  const isPending = createAddressMutation.isPending || updateAddressMutation.isPending;
  const errorMessage = createAddressMutation.error?.message ?? updateAddressMutation.error?.message ?? null;

  const handleDrawerClose = () => {
    createAddressMutation.reset();
    updateAddressMutation.reset();
    reset(defaultValues);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "edit" && address) {
      await updateAddressMutation.mutateAsync({
        clientId,
        input: {
          id: address.id,
          clientId,
          ...values,
        },
      });
      return;
    }

    await createAddressMutation.mutateAsync({
      clientId,
      input: {
        clientId,
        ...values,
      },
    });
  });

  return (
    <ResponsiveDrawer
      open={open}
      onClose={handleDrawerClose}
      sx={{
        width: "100%",
        maxWidth: 520,
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 520 },
          maxWidth: "100%",
        },
      }}
    >
      <DialogTitle>{mode === "edit" ? "Editar direccion" : "Nueva direccion"}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent dividers>
          <Stack spacing={2.25}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <Box>
              <CustomFormLabel htmlFor="address-label">Etiqueta</CustomFormLabel>
              <Controller
                name="label"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="address-label"
                    fullWidth
                    error={Boolean(errors.label)}
                    helperText={errors.label?.message ?? "Ej. Default Shipping, Casa, Oficina."}
                  />
                )}
              />
            </Box>

            <Box>
              <CustomFormLabel htmlFor="address-line1">Linea principal</CustomFormLabel>
              <Controller
                name="line1"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="address-line1"
                    fullWidth
                    error={Boolean(errors.line1)}
                    helperText={errors.line1?.message}
                  />
                )}
              />
            </Box>

            <Box>
              <CustomFormLabel htmlFor="address-line2">Linea secundaria</CustomFormLabel>
              <Controller
                name="line2"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id="address-line2"
                    fullWidth
                    error={Boolean(errors.line2)}
                    helperText={errors.line2?.message ?? "Opcional."}
                  />
                )}
              />
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="address-city">Ciudad</CustomFormLabel>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="address-city"
                      fullWidth
                      error={Boolean(errors.city)}
                      helperText={errors.city?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="address-state">Estado</CustomFormLabel>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="address-state"
                      fullWidth
                      error={Boolean(errors.state)}
                      helperText={errors.state?.message ?? "Opcional."}
                    />
                  )}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="address-postal-code">Codigo postal</CustomFormLabel>
                <Controller
                  name="postalCode"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="address-postal-code"
                      fullWidth
                      error={Boolean(errors.postalCode)}
                      helperText={errors.postalCode?.message ?? "Opcional."}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel htmlFor="address-country">Pais</CustomFormLabel>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      id="address-country"
                      fullWidth
                      error={Boolean(errors.country)}
                      helperText={errors.country?.message}
                    />
                  )}
                />
              </Box>
            </Stack>

            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <CustomCheckbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label="Marcar como direccion predeterminada"
                />
              )}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
              <Button onClick={handleDrawerClose} color="inherit">
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={isPending}>
                {isPending
                  ? mode === "edit"
                    ? "Guardando cambios..."
                    : "Guardando..."
                  : mode === "edit"
                    ? "Guardar direccion"
                    : "Crear direccion"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Box>
    </ResponsiveDrawer>
  );
}
