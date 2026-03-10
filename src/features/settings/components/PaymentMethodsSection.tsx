"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertDialog from "@/app/components/ui-components/dialog/AlertDialog";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { usePaymentMethodsQuery } from "@/features/settings/settings.queries";
import {
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
} from "@/features/settings/settings.mutations";
import {
  upsertPaymentMethodSchema,
  type UpsertPaymentMethodValues,
} from "@/features/settings/schemas";
import type { PaymentMethod } from "@/features/settings/settings.types";

export function PaymentMethodsSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [deletingItem, setDeletingItem] = useState<PaymentMethod | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const paymentMethodsQuery = usePaymentMethodsQuery();

  const deleteMutation = useDeletePaymentMethodMutation({
    onSuccess: () => {
      setSuccessMessage("Método de pago eliminado correctamente.");
      setDeletingItem(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditing(method);
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleCompleted = (message: string) => {
    setSuccessMessage(message);
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        mb={2}
      >
        <Box>
          <Typography variant="h6">Métodos de pago</Typography>
          <Typography variant="body2" color="textSecondary">
            Formas de pago aceptadas: efectivo, tarjeta, transferencia, etc.
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreate} sx={{ flexShrink: 0 }}>
          Agregar método
        </Button>
      </Stack>

      {successMessage ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      ) : null}

      {paymentMethodsQuery.isLoading ? (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {paymentMethodsQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button
              size="small"
              color="inherit"
              onClick={() => paymentMethodsQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {paymentMethodsQuery.error.message}
        </Alert>
      ) : null}

      {paymentMethodsQuery.isSuccess &&
      paymentMethodsQuery.data.paymentMethods.length === 0 ? (
        <Alert severity="info">No hay métodos de pago registrados todavía.</Alert>
      ) : null}

      {paymentMethodsQuery.isSuccess &&
      paymentMethodsQuery.data.paymentMethods.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentMethodsQuery.data.paymentMethods.map((method) => (
                <TableRow key={method.id} hover>
                  <TableCell>{method.name}</TableCell>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace">
                      {method.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={method.is_active ? "Activo" : "Inactivo"}
                      color={method.is_active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(method)}>
                        <IconEdit size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSuccessMessage(null);
                          deleteMutation.reset();
                          setDeletingItem(method);
                        }}
                      >
                        <IconTrash size={16} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      <PaymentMethodFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onCompleted={handleCompleted}
        editing={editing}
      />

      <AlertDialog
        open={Boolean(deletingItem)}
        onClose={() => {
          deleteMutation.reset();
          setDeletingItem(null);
        }}
        onConfirm={() => {
          if (deletingItem) void deleteMutation.mutateAsync(deletingItem.id);
        }}
        title="Eliminar método de pago"
        confirmText="Eliminar"
        isPending={deleteMutation.isPending}
      >
        {deleteMutation.error?.message ??
          `¿Deseas eliminar el método "${deletingItem?.name}"? Esta acción no se puede deshacer.`}
      </AlertDialog>
    </Box>
  );
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────

interface PaymentMethodFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCompleted: (message: string) => void;
  editing: PaymentMethod | null;
}

function PaymentMethodFormDialog({
  open,
  onClose,
  onCompleted,
  editing,
}: PaymentMethodFormDialogProps) {
  const isEdit = Boolean(editing);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpsertPaymentMethodValues>({
    resolver: zodResolver(upsertPaymentMethodSchema),
    defaultValues: {
      name: editing?.name ?? "",
      code: editing?.code ?? "",
      is_active: editing?.is_active ?? true,
    },
  });

  useEffect(() => {
    reset({
      name: editing?.name ?? "",
      code: editing?.code ?? "",
      is_active: editing?.is_active ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const createMutation = useCreatePaymentMethodMutation({
    onSuccess: () => {
      reset({ name: "", code: "", is_active: true });
      onCompleted("Método de pago creado correctamente.");
    },
  });

  const updateMutation = useUpdatePaymentMethodMutation({
    onSuccess: () => {
      onCompleted("Método de pago actualizado correctamente.");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    createMutation.error?.message ?? updateMutation.error?.message ?? null;

  const onSubmit = handleSubmit(async (values) => {
    createMutation.reset();
    updateMutation.reset();
    if (isEdit && editing) {
      await updateMutation.mutateAsync({ id: editing.id, input: values });
    } else {
      await createMutation.mutateAsync(values);
    }
  });

  const handleClose = () => {
    createMutation.reset();
    updateMutation.reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? "Editar método de pago" : "Nuevo método de pago"}
      </DialogTitle>
      <Divider />
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2.5}>
            {errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : null}

            <Box>
              <CustomFormLabel htmlFor="pm-name">Nombre</CustomFormLabel>
              <CustomTextField
                id="pm-name"
                fullWidth
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                {...register("name")}
              />
            </Box>

            <Box>
              <CustomFormLabel htmlFor="pm-code">Código</CustomFormLabel>
              <CustomTextField
                id="pm-code"
                fullWidth
                error={Boolean(errors.code)}
                helperText={
                  errors.code?.message ?? "Ej. CASH, CARD_DEBIT, TRANSFER"
                }
                inputProps={{ style: { textTransform: "uppercase" } }}
                {...register("code")}
              />
            </Box>

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Método activo"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit" disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : "Crear método"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
