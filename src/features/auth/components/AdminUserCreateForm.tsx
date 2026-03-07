"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { useCreateAdminUserMutation } from "@/features/auth/admin-users.mutations";
import {
  createInternalUserSchema,
  type CreateInternalUserInput,
} from "@/features/auth/schemas";

const roleOptions = [
  { value: "admin", label: "Administrador" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cajero" },
  { value: "inventory", label: "Inventario" },
] as const;

export function AdminUserCreateForm() {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInternalUserInput>({
    resolver: zodResolver(createInternalUserSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      roleCode: "manager",
    },
  });

  const createUserMutation = useCreateAdminUserMutation({
    onSuccess: (result, variables) => {
      setServerMessage(result.message);
      reset({
        email: "",
        fullName: "",
        password: "",
        roleCode: variables.roleCode,
      });

      startTransition(() => {
        router.push("/admin/users?created=1");
        router.refresh();
      });
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    await createUserMutation.mutateAsync(values);
  });

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack spacing={2}>
        <Typography variant="body1" color="textSecondary">
          Solo un usuario con rol administrador puede dar de alta nuevas cuentas. Cada usuario se crea con una contrasena temporal.
        </Typography>
        {serverMessage ? <Alert severity="success">{serverMessage}</Alert> : null}
        {createUserMutation.error ? (
          <Alert severity="error">{createUserMutation.error.message}</Alert>
        ) : null}
        <Box>
          <CustomFormLabel htmlFor="fullName">Nombre completo</CustomFormLabel>
          <CustomTextField
            id="fullName"
            fullWidth
            error={Boolean(errors.fullName)}
            helperText={errors.fullName?.message}
            {...register("fullName")}
          />
        </Box>
        <Box>
          <CustomFormLabel htmlFor="email">Correo</CustomFormLabel>
          <CustomTextField
            id="email"
            type="email"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register("email")}
          />
        </Box>
        <Box>
          <CustomFormLabel htmlFor="password">Contrasena temporal</CustomFormLabel>
          <CustomTextField
            id="password"
            type="password"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            {...register("password")}
          />
        </Box>
        <Box>
          <CustomFormLabel htmlFor="roleCode">Rol inicial</CustomFormLabel>
          <CustomTextField
            id="roleCode"
            select
            fullWidth
            error={Boolean(errors.roleCode)}
            helperText={errors.roleCode?.message}
            defaultValue="manager"
            {...register("roleCode")}
          >
            {roleOptions.map((roleOption) => (
              <MenuItem key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </MenuItem>
            ))}
          </CustomTextField>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
          <Button component={Link} href="/admin/users" color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? "Creando usuario..." : "Crear usuario interno"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}