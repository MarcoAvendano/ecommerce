import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingresa un correo valido."),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
  remember: z.boolean(),
});

export const createInternalUserSchema = z.object({
  email: z.email("Ingresa un correo valido."),
  fullName: z.string().min(3, "Ingresa el nombre completo."),
  password: z.string().min(8, "La contrasena temporal debe tener al menos 8 caracteres."),
  roleCode: z.enum(["admin", "manager", "cashier", "inventory"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateInternalUserInput = z.infer<typeof createInternalUserSchema>;