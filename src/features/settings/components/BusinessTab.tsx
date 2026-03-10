"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import BlankCard from "@/app/components/shared/BlankCard";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { useBusinessQuery } from "@/features/settings/settings.queries";
import {
  useUpdateBusinessMutation,
  useUploadLogoMutation,
} from "@/features/settings/settings.mutations";
import {
  updateBusinessSchema,
  type UpdateBusinessValues,
} from "@/features/settings/schemas";

interface BusinessTabProps {
  isAdmin: boolean;
}

export default function BusinessTab({ isAdmin }: BusinessTabProps) {
  const { data, isLoading } = useBusinessQuery();
  const business = data?.business ?? null;

  if (!isAdmin) {
    return (
      <Alert severity="warning">
        Solo los administradores pueden gestionar la configuración del negocio.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={6}>
        <LogoCard logoUrl={business?.logo_url ?? null} />
      </Grid>
      <Grid item xs={12} lg={6}>
        <BusinessNameCard name={business?.name ?? ""} />
      </Grid>
    </Grid>
  );
}

// ─── Logo Card ────────────────────────────────────────────────────────────────

function LogoCard({ logoUrl }: { logoUrl: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(logoUrl);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const uploadMutation = useUploadLogoMutation({
    onSuccess: (url) => {
      setPreviewUrl(url);
      setSuccessMessage("Logo actualizado correctamente.");
    },
  });

  useEffect(() => {
    setPreviewUrl(logoUrl);
  }, [logoUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.reset();
    setSuccessMessage(null);
    await uploadMutation.mutateAsync(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    setPreviewUrl(logoUrl);
    uploadMutation.reset();
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <BlankCard>
      <CardContent>
        <Typography variant="h5" mb={1}>
          Logo del negocio
        </Typography>
        <Typography color="textSecondary" mb={3}>
          Sube el logo que identificará a tu negocio en el sistema
        </Typography>

        {successMessage ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        ) : null}

        {uploadMutation.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {uploadMutation.error?.message}
          </Alert>
        ) : null}

        <Box textAlign="center">
          <Avatar
            src={previewUrl ?? undefined}
            variant="rounded"
            sx={{ width: 160, height: 100, margin: "0 auto", objectFit: "contain" }}
          />
          <Stack direction="row" justifyContent="center" spacing={2} my={3}>
            <Button
              variant="contained"
              color="primary"
              component="label"
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Subiendo..." : "Subir logo"}
              <input
                ref={fileInputRef}
                hidden
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                type="file"
                onChange={handleFileChange}
              />
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleReset}
              disabled={uploadMutation.isPending}
            >
              Restablecer
            </Button>
          </Stack>
          <Typography variant="subtitle2" color="textSecondary">
            JPG, PNG, SVG o WEBP. Máx. 2 MB.
          </Typography>
        </Box>
      </CardContent>
    </BlankCard>
  );
}

// ─── Business Name Card ───────────────────────────────────────────────────────

function BusinessNameCard({ name }: { name: string }) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBusinessValues>({
    resolver: zodResolver(updateBusinessSchema),
    defaultValues: { name },
  });

  useEffect(() => {
    reset({ name });
  }, [name, reset]);

  const mutation = useUpdateBusinessMutation({
    onSuccess: () => {
      setSuccessMessage("Negocio actualizado correctamente.");
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    mutation.reset();
    setSuccessMessage(null);
    await mutation.mutateAsync(values);
  });

  return (
    <BlankCard sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h5" mb={1}>
          Información del negocio
        </Typography>
        <Typography color="textSecondary" mb={3}>
          Actualiza el nombre con el que aparece tu negocio en el sistema
        </Typography>

        {successMessage ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        ) : null}

        {mutation.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {mutation.error?.message}
          </Alert>
        ) : null}

        <Box component="form" onSubmit={onSubmit} noValidate>
          <Box>
            <CustomFormLabel htmlFor="business-name">
              Nombre del negocio
            </CustomFormLabel>
            <CustomTextField
              id="business-name"
              fullWidth
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register("name")}
            />
          </Box>
          <Stack direction="row" justifyContent="flex-end" mt={3}>
            <Button
              type="submit"
              size="large"
              variant="contained"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </BlankCard>
  );
}
