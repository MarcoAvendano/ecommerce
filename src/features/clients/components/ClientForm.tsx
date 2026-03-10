"use client";

import { useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import {
  useCreateClientMutation,
  useUpdateClientMutation,
} from "@/features/clients/clients.mutations";
import {
  createClientSchema,
  type CreateClientInput,
} from "@/features/clients/schemas";
import type { ClientListItem } from "@/features/clients/clients.types";

interface ClientFormProps {
  mode?: "create" | "edit";
  client?: ClientListItem | null;
  onCompleted: (message: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  hideIntro?: boolean;
}

const defaultValues: CreateClientInput = {
  fullName: "",
  email: "",
  phone: "",
  documentType: "",
  documentNumber: "",
  notes: "",
};

export function ClientForm({
  mode = "create",
  client = null,
  onCompleted,
  onCancel,
  submitLabel,
  hideIntro = false,
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues,
  });

  const createClientMutation = useCreateClientMutation({
    onSuccess: (result) => {
      reset(defaultValues);
      onCompleted(result.message);
    },
  });

  const updateClientMutation = useUpdateClientMutation({
    onSuccess: (result) => {
      onCompleted(result.message);
    },
  });

  useEffect(() => {
    reset(
      client
        ? {
            fullName: client.fullName,
            email: client.email ?? "",
            phone: client.phone ?? "",
            documentType: client.documentType ?? "",
            documentNumber: client.documentNumber ?? "",
            notes: client.notes ?? "",
          }
        : defaultValues,
    );
  }, [client, reset]);

  const isPending = createClientMutation.isPending || updateClientMutation.isPending;
  const errorMessage = createClientMutation.error?.message ?? updateClientMutation.error?.message ?? null;

  const handleCancel = () => {
    createClientMutation.reset();
    updateClientMutation.reset();
    reset(
      client
        ? {
            fullName: client.fullName,
            email: client.email ?? "",
            phone: client.phone ?? "",
            documentType: client.documentType ?? "",
            documentNumber: client.documentNumber ?? "",
            notes: client.notes ?? "",
          }
        : defaultValues,
    );
    onCancel?.();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "edit" && client) {
      await updateClientMutation.mutateAsync({
        id: client.id,
        ...values,
      });
      return;
    }

    await createClientMutation.mutateAsync(values);
  });

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack spacing={2.5}>
        {!hideIntro ? (
          <Typography variant="body2" color="textSecondary">
            {mode === "edit"
              ? "Actualiza los datos comerciales del cliente sin salir del listado principal."
              : "Registra clientes para acelerar la captura de ventas y mantener un historial comercial centralizado."}
          </Typography>
        ) : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Box>
          <CustomFormLabel htmlFor="client-full-name">Nombre completo</CustomFormLabel>
          <CustomTextField
            id="client-full-name"
            fullWidth
            error={Boolean(errors.fullName)}
            helperText={errors.fullName?.message}
            {...register("fullName")}
          />
        </Box>

        <Box>
          <CustomFormLabel htmlFor="client-email">Correo</CustomFormLabel>
          <CustomTextField
            id="client-email"
            type="email"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message ?? "Opcional."}
            {...register("email")}
          />
        </Box>

        <Box>
          <CustomFormLabel htmlFor="client-phone">Telefono</CustomFormLabel>
          <CustomTextField
            id="client-phone"
            fullWidth
            error={Boolean(errors.phone)}
            helperText={errors.phone?.message ?? "Opcional."}
            {...register("phone")}
          />
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <CustomFormLabel htmlFor="client-document-type">Tipo de documento</CustomFormLabel>
            <Select
              id="client-document-type"
              fullWidth
              error={Boolean(errors.documentType)}
              displayEmpty
              defaultValue={client?.documentType ?? ""}
              {...register("documentType")}
            >
              <MenuItem value="" disabled>
                Selecciona un tipo de documento
              </MenuItem>
              {
                ["Cedula", "Pasaporte", "Otro"].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))
              }
            </Select>
            {/* <CustomTextField
              id="client-document-type"
              fullWidth
              error={Boolean(errors.documentType)}
              helperText={errors.documentType?.message ?? "Ej. RFC, INE, Pasaporte."}
              {...register("documentType")}
            /> */}
          </Box>
          <Box sx={{ flex: 1 }}>
            <CustomFormLabel htmlFor="client-document-number">Numero de documento</CustomFormLabel>
            <CustomTextField
              id="client-document-number"
              fullWidth
              error={Boolean(errors.documentNumber)}
              helperText={errors.documentNumber?.message ?? "Opcional."}
              {...register("documentNumber")}
            />
          </Box>
        </Stack>

        <Box>
          <CustomFormLabel htmlFor="client-notes">Notas</CustomFormLabel>
          <CustomTextField
            id="client-notes"
            fullWidth
            multiline
            minRows={4}
            error={Boolean(errors.notes)}
            helperText={errors.notes?.message ?? "Datos operativos o preferencias del cliente."}
            {...register("notes")}
          />
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
          {onCancel ? (
            <Button onClick={handleCancel} color="inherit">
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending
              ? mode === "edit"
                ? "Guardando cambios..."
                : "Guardando..."
              : submitLabel ?? (mode === "edit" ? "Guardar cambios" : "Crear cliente")}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
