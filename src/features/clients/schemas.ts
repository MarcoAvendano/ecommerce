import { z } from "zod";

export const createClientSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa el nombre completo del cliente."),
  email: z
    .string()
    .trim()
    .max(255, "El correo no puede superar 255 caracteres.")
    .refine((value) => value.length === 0 || z.email().safeParse(value).success, {
      message: "Ingresa un correo valido.",
    }),
  phone: z.string().trim().max(30, "El telefono no puede superar 30 caracteres."),
  documentType: z.string().trim().max(50, "El tipo de documento no puede superar 50 caracteres."),
  documentNumber: z.string().trim().max(80, "El numero de documento no puede superar 80 caracteres."),
  notes: z.string().trim().max(500, "Las notas no pueden superar 500 caracteres."),
});

export const updateClientSchema = createClientSchema.extend({
  id: z.string().uuid("El cliente es invalido."),
});

export const createClientAddressSchema = z.object({
  clientId: z.string().uuid("El cliente es invalido."),
  label: z.string().trim().min(2, "Ingresa una etiqueta para la direccion."),
  line1: z.string().trim().min(3, "Ingresa la linea principal de la direccion."),
  line2: z.string().trim().max(255, "La segunda linea es demasiado larga."),
  city: z.string().trim().min(2, "Ingresa la ciudad."),
  state: z.string().trim().max(120, "El estado es demasiado largo."),
  postalCode: z.string().trim().max(20, "El codigo postal es demasiado largo."),
  country: z.string().trim().min(2, "Ingresa el pais."),
  isDefault: z.boolean(),
});

export const updateClientAddressSchema = createClientAddressSchema.extend({
  id: z.string().uuid("La direccion es invalida."),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateClientAddressInput = z.infer<typeof createClientAddressSchema>;
export type UpdateClientAddressInput = z.infer<typeof updateClientAddressSchema>;
