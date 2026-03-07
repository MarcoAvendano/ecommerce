"use client";

import {
  Alert,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginType } from "@/app/(DashboardLayout)/types/auth/auth";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });
  const emailField = register("email");
  const passwordField = register("password");
  const rememberField = register("remember");

  const onSubmit = handleSubmit(async ({ email, password }) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("root", {
        message: error.message,
      });
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  });
  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h3" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack>
          {errors.root?.message ? (
            <Alert severity="error" sx={{ mt: 3 }}>
              {errors.root.message}
            </Alert>
          ) : null}
          <Box>
            <CustomFormLabel htmlFor="email">Correo</CustomFormLabel>
            <CustomTextField
              id="email"
              type="email"
              variant="outlined"
              fullWidth
              placeholder="admin@tu-tienda.com"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              name={emailField.name}
              onBlur={emailField.onBlur}
              onChange={emailField.onChange}
              inputRef={emailField.ref}
            />
          </Box>
          <Box>
            <CustomFormLabel htmlFor="password">Contrasena</CustomFormLabel>
            <CustomTextField
              id="password"
              type="password"
              variant="outlined"
              fullWidth
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              name={passwordField.name}
              onBlur={passwordField.onBlur}
              onChange={passwordField.onChange}
              inputRef={passwordField.ref}
            />
          </Box>
          <Stack
            justifyContent="space-between"
            direction="row"
            alignItems="center"
            my={2}
          >
            <FormGroup>
              <FormControlLabel
                control={
                  <CustomCheckbox
                    name={rememberField.name}
                    onBlur={rememberField.onBlur}
                    onChange={rememberField.onChange}
                    inputRef={rememberField.ref}
                    defaultChecked
                  />
                }
                label="Recordar este equipo"
              />
            </FormGroup>
            <Typography variant="body2" color="textSecondary">
              Solicita soporte al administrador si perdiste tu acceso.
            </Typography>
          </Stack>
        </Stack>
        <Box>
          <Button
            color="primary"
            variant="contained"
            size="large"
            fullWidth
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Ingresando..." : "Iniciar sesion"}
          </Button>
        </Box>
      </Box>
      {subtitle}
    </>
  );
};

export default AuthLogin;
