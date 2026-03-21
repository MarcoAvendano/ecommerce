"use client";

import { useEffect } from "react";
import { Alert, Box, Button, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { ResponsiveDrawer } from "@/app/components/ui-components/drawer/ResponsiveDrawer";
import {
  useCreateSupplierContactMutation,
  useUpdateSupplierContactMutation,
} from "@/features/suppliers/suppliers.mutations";
import {
  createSupplierContactSchema,
  type CreateSupplierContactInput,
} from "@/features/suppliers/schemas";
import type { SupplierContactItem } from "@/features/suppliers/suppliers.types";

interface SupplierContactDrawerProps {
  supplierId: string;
  open: boolean;
  mode: "create" | "edit";
  contact?: SupplierContactItem | null;
  onClose: () => void;
  onCompleted: (message: string) => void;
}

const defaultValues: CreateSupplierContactInput = {
  supplierId: "",
  fullName: "",
  email: "",
  phone: "",
  role: "",
};

function getDefaultValues(supplierId: string, contact?: SupplierContactItem | null): CreateSupplierContactInput {
  if (!contact) {
    return { ...defaultValues, supplierId };
  }

  return {
    supplierId,
    fullName: contact.fullName,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    role: contact.role ?? "",
  };
}

export function SupplierContactDrawer({ supplierId, open, mode, contact = null, onClose, onCompleted }: SupplierContactDrawerProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSupplierContactInput>({
    resolver: zodResolver(createSupplierContactSchema) as Resolver<CreateSupplierContactInput>,
    defaultValues: getDefaultValues(supplierId, contact),
  });

  const createContactMutation = useCreateSupplierContactMutation({
    onSuccess: (result) => {
      onCompleted(result.message);
      onClose();
    },
  });

  const updateContactMutation = useUpdateSupplierContactMutation({
    onSuccess: (result) => {
      onCompleted(result.message);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(getDefaultValues(supplierId, contact));
  }, [contact, open, reset, supplierId]);

  const isPending = createContactMutation.isPending || updateContactMutation.isPending;
  const errorMessage = createContactMutation.error?.message ?? updateContactMutation.error?.message ?? null;

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "edit" && contact) {
      await updateContactMutation.mutateAsync({
        supplierId,
        input: {
          id: contact.id,
          ...values,
        },
      });
      return;
    }

    await createContactMutation.mutateAsync({ supplierId, input: values });
  });

  return (
    <ResponsiveDrawer open={open} onClose={onClose} sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 460 } } }}>
      <DialogTitle>{mode === "edit" ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <Box>
              <CustomFormLabel htmlFor="supplier-contact-name">Nombre</CustomFormLabel>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <CustomTextField {...field} id="supplier-contact-name" fullWidth error={Boolean(errors.fullName)} helperText={errors.fullName?.message} />
                )}
              />
            </Box>

            <Box>
              <CustomFormLabel htmlFor="supplier-contact-email">Correo</CustomFormLabel>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <CustomTextField {...field} id="supplier-contact-email" fullWidth error={Boolean(errors.email)} helperText={errors.email?.message ?? "Opcional."} />
                )}
              />
            </Box>

            <Box>
              <CustomFormLabel htmlFor="supplier-contact-phone">Telefono</CustomFormLabel>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <CustomTextField {...field} id="supplier-contact-phone" fullWidth error={Boolean(errors.phone)} helperText={errors.phone?.message ?? "Opcional."} />
                )}
              />
            </Box>

            <Box>
              <CustomFormLabel htmlFor="supplier-contact-role">Cargo</CustomFormLabel>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <CustomTextField {...field} id="supplier-contact-role" fullWidth error={Boolean(errors.role)} helperText={errors.role?.message ?? "Opcional."} />
                )}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={isPending}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Guardando..." : mode === "edit" ? "Guardar contacto" : "Crear contacto"}
          </Button>
        </DialogActions>
      </Box>
    </ResponsiveDrawer>
  );
}
