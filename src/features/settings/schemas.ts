import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, "El nombre es requerido.").trim(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida."),
    newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas nuevas no coinciden.",
    path: ["confirmPassword"],
  });

export const updateBusinessSchema = z.object({
  name: z.string().min(1, "El nombre del negocio es requerido.").trim(),
});

export const upsertLocationSchema = z.object({
  name: z.string().min(1, "El nombre es requerido.").trim(),
  code: z
    .string()
    .min(1, "El código es requerido.")
    .max(20, "El código no puede superar 20 caracteres.")
    .trim(),
  location_type: z.enum(["warehouse", "store", "transit", "virtual"]),
  is_active: z.boolean(),
});

export const upsertPaymentMethodSchema = z.object({
  name: z.string().min(1, "El nombre es requerido.").trim(),
  code: z
    .string()
    .min(1, "El código es requerido.")
    .max(50, "El código no puede superar 50 caracteres.")
    .trim(),
  is_active: z.boolean(),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type UpdateBusinessValues = z.infer<typeof updateBusinessSchema>;
export type UpsertLocationValues = z.infer<typeof upsertLocationSchema>;
export type UpsertPaymentMethodValues = z.infer<typeof upsertPaymentMethodSchema>;
