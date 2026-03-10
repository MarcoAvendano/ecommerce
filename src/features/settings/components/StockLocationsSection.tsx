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
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
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
import { useLocationsQuery } from "@/features/settings/settings.queries";
import {
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} from "@/features/settings/settings.mutations";
import {
  upsertLocationSchema,
  type UpsertLocationValues,
} from "@/features/settings/schemas";
import type { InventoryLocation } from "@/features/settings/settings.types";

const LOCATION_TYPE_LABELS: Record<string, string> = {
  warehouse: "Almacén",
  store: "Tienda",
  transit: "Tránsito",
  virtual: "Virtual",
};

export function StockLocationsSection() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryLocation | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryLocation | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const locationsQuery = useLocationsQuery();

  const deleteMutation = useDeleteLocationMutation({
    onSuccess: () => {
      setSuccessMessage("Ubicación eliminada correctamente.");
      setDeletingItem(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setSuccessMessage(null);
    setDrawerOpen(true);
  };

  const openEdit = (location: InventoryLocation) => {
    setEditing(location);
    setSuccessMessage(null);
    setDrawerOpen(true);
  };

  const handleCompleted = (message: string) => {
    setSuccessMessage(message);
    setDrawerOpen(false);
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
          <Typography variant="h6">Ubicaciones de stock</Typography>
          <Typography variant="body2" color="textSecondary">
            Almacenes, tiendas y otros puntos donde se gestiona el inventario.
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreate} sx={{ flexShrink: 0 }}>
          Agregar ubicación
        </Button>
      </Stack>

      {successMessage ? <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert> : null}

      {locationsQuery.isLoading ? (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {locationsQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button size="small" color="inherit" onClick={() => locationsQuery.refetch()}>
              Reintentar
            </Button>
          }
        >
          {locationsQuery.error.message}
        </Alert>
      ) : null}

      {locationsQuery.isSuccess && locationsQuery.data.locations.length === 0 ? (
        <Alert severity="info">No hay ubicaciones registradas todavía.</Alert>
      ) : null}

      {locationsQuery.isSuccess && locationsQuery.data.locations.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locationsQuery.data.locations.map((loc) => (
                <TableRow key={loc.id} hover>
                  <TableCell>{loc.name}</TableCell>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace">
                      {loc.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {LOCATION_TYPE_LABELS[loc.location_type] ?? loc.location_type}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={loc.is_active ? "Activo" : "Inactivo"}
                      color={loc.is_active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(loc)}>
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
                          setDeletingItem(loc);
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

      <LocationFormDialog
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
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
        title="Eliminar ubicación"
        confirmText="Eliminar"
        isPending={deleteMutation.isPending}
      >
        {deleteMutation.error?.message ??
          `¿Deseas eliminar la ubicación "${deletingItem?.name}"? Esta acción no se puede deshacer.`}
      </AlertDialog>
    </Box>
  );
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────

interface LocationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCompleted: (message: string) => void;
  editing: InventoryLocation | null;
}

function LocationFormDialog({
  open,
  onClose,
  onCompleted,
  editing,
}: LocationFormDialogProps) {
  const isEdit = Boolean(editing);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpsertLocationValues>({
    resolver: zodResolver(upsertLocationSchema),
    defaultValues: {
      name: editing?.name ?? "",
      code: editing?.code ?? "",
      location_type: (editing?.location_type as UpsertLocationValues["location_type"]) ?? "warehouse",
      is_active: editing?.is_active ?? true,
    },
  });

  // Reset when editing changes
  useEffect(() => {
    reset({
      name: editing?.name ?? "",
      code: editing?.code ?? "",
      location_type: (editing?.location_type as UpsertLocationValues["location_type"]) ?? "warehouse",
      is_active: editing?.is_active ?? true,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const createMutation = useCreateLocationMutation({
    onSuccess: () => {
      reset({ name: "", code: "", location_type: "warehouse", is_active: true });
      onCompleted("Ubicación creada correctamente.");
    },
  });

  const updateMutation = useUpdateLocationMutation({
    onSuccess: () => {
      onCompleted("Ubicación actualizada correctamente.");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage = createMutation.error?.message ?? updateMutation.error?.message ?? null;

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
        {isEdit ? "Editar ubicación" : "Nueva ubicación"}
      </DialogTitle>
      <Divider />
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2.5}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <Box>
              <CustomFormLabel htmlFor="loc-name">Nombre</CustomFormLabel>
              <CustomTextField
                id="loc-name"
                fullWidth
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                {...register("name")}
              />
            </Box>

            <Box>
              <CustomFormLabel htmlFor="loc-code">Código</CustomFormLabel>
              <CustomTextField
                id="loc-code"
                fullWidth
                error={Boolean(errors.code)}
                helperText={errors.code?.message ?? "Ej. ALM-01, TIENDA-MX"}
                inputProps={{ style: { textTransform: "uppercase" } }}
                {...register("code")}
              />
            </Box>

            <Box>
              <CustomFormLabel htmlFor="loc-type">Tipo</CustomFormLabel>
              <Controller
                name="location_type"
                control={control}
                render={({ field }) => (
                  <Select id="loc-type" fullWidth {...field}>
                    <MenuItem value="warehouse">Almacén</MenuItem>
                    <MenuItem value="store">Tienda</MenuItem>
                    <MenuItem value="transit">Tránsito</MenuItem>
                    <MenuItem value="virtual">Virtual</MenuItem>
                  </Select>
                )}
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
                  label="Ubicación activa"
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
            {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear ubicación"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
