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
import { useProfileQuery } from "@/features/settings/settings.queries";
import {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useChangePasswordMutation,
} from "@/features/settings/settings.mutations";
import { updateProfileSchema, changePasswordSchema, type UpdateProfileValues, type ChangePasswordValues } from "@/features/settings/schemas";
import ImageCropModal from "@/app/components/shared/ImageCropModal";

export default function ProfileTab() {
  const { data: profileData, isLoading } = useProfileQuery();
  const profile = profileData?.profile ?? null;

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
        <AvatarCard avatarUrl={profile?.avatar_url ?? null} />
      </Grid>
      <Grid item xs={12} lg={6}>
        <ChangePasswordCard />
      </Grid>
      <Grid item xs={12}>
        <PersonalDetailsCard
          fullName={profile?.full_name ?? ""}
          email={profile?.email ?? ""}
        />
      </Grid>
    </Grid>
  );
}

// ─── Avatar Card ──────────────────────────────────────────────────────────────

function AvatarCard({ avatarUrl }: { avatarUrl: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useUploadAvatarMutation({
    onSuccess: (url) => {
      setPreviewUrl(url);
      setSuccessMessage("Avatar actualizado correctamente.");
    },
  });

  useEffect(() => {
    setPreviewUrl(avatarUrl);
  }, [avatarUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setCropModalOpen(true);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropSave = async (croppedFile: File) => {
    setCropModalOpen(false);
    setSelectedFile(null);
    uploadMutation.reset();
    setSuccessMessage(null);
    await uploadMutation.mutateAsync(croppedFile);
  };

  const handleReset = () => {
    setPreviewUrl(avatarUrl);
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
          Foto de perfil
        </Typography>
        <Typography color="textSecondary" mb={3}>
          Cambia tu foto de perfil desde aquí
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
            sx={{ width: 120, height: 120, margin: "0 auto" }}
          />
          <Stack direction="row" justifyContent="center" spacing={2} my={3}>
            <Button
              variant="contained"
              color="primary"
              component="label"
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Subiendo..." : "Subir foto"}
              <input
                ref={fileInputRef}
                hidden
                accept="image/jpeg,image/png,image/gif,image/webp"
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
            JPG, PNG, GIF o WEBP. Máx. 800 KB.
          </Typography>
        </Box>
      </CardContent>
      <ImageCropModal
        open={cropModalOpen}
        imageFile={selectedFile}
        onClose={() => {
          setCropModalOpen(false);
          setSelectedFile(null);
        }}
        onCropSave={handleCropSave}
        aspectRatio={1}
      />
    </BlankCard>
  );
}

// ─── Change Password Card ─────────────────────────────────────────────────────

function ChangePasswordCard() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const mutation = useChangePasswordMutation({
    onSuccess: () => {
      reset();
      setSuccessMessage("Contraseña actualizada correctamente.");
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
          Cambiar contraseña
        </Typography>
        <Typography color="textSecondary" mb={3}>
          Confirma tu contraseña actual antes de establecer una nueva
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
          <Stack spacing={2}>
            <Box>
              <CustomFormLabel htmlFor="current-password">
                Contraseña actual
              </CustomFormLabel>
              <CustomTextField
                id="current-password"
                type="password"
                fullWidth
                error={Boolean(errors.currentPassword)}
                helperText={errors.currentPassword?.message}
                {...register("currentPassword")}
              />
            </Box>
            <Box>
              <CustomFormLabel htmlFor="new-password">
                Nueva contraseña
              </CustomFormLabel>
              <CustomTextField
                id="new-password"
                type="password"
                fullWidth
                error={Boolean(errors.newPassword)}
                helperText={errors.newPassword?.message}
                {...register("newPassword")}
              />
            </Box>
            <Box>
              <CustomFormLabel htmlFor="confirm-password">
                Confirmar contraseña
              </CustomFormLabel>
              <CustomTextField
                id="confirm-password"
                type="password"
                fullWidth
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </Box>
            <Stack direction="row" justifyContent="flex-end" spacing={2} pt={1}>
              <Button
                type="submit"
                variant="contained"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Guardando..." : "Cambiar contraseña"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </BlankCard>
  );
}

// ─── Personal Details Card ────────────────────────────────────────────────────

function PersonalDetailsCard({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName },
  });

  useEffect(() => {
    reset({ fullName });
  }, [fullName, reset]);

  const mutation = useUpdateProfileMutation({
    onSuccess: () => {
      setSuccessMessage("Datos actualizados correctamente.");
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    mutation.reset();
    setSuccessMessage(null);
    await mutation.mutateAsync(values);
  });

  return (
    <BlankCard>
      <CardContent>
        <Typography variant="h5" mb={1}>
          Datos personales
        </Typography>
        <Typography color="textSecondary" mb={3}>
          Edita y guarda tus datos desde aquí
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
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <CustomFormLabel htmlFor="profile-full-name">Nombre completo</CustomFormLabel>
              <CustomTextField
                id="profile-full-name"
                fullWidth
                error={Boolean(errors.fullName)}
                helperText={errors.fullName?.message}
                {...register("fullName")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomFormLabel htmlFor="profile-email">
                Correo electrónico
              </CustomFormLabel>
              <CustomTextField
                id="profile-email"
                value={email}
                fullWidth
                disabled
                helperText="El correo no puede modificarse desde aquí."
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
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
