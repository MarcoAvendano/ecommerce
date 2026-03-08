import { z } from "zod";

export const salesOrderItemSchema = z.object({
  variantId: z.string().uuid("La variante es invalida."),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a cero."),
  unitPriceCents: z.coerce.number().int().min(0, "El precio debe ser cero o mayor."),
  discountCents: z.coerce.number().int().min(0, "El descuento debe ser cero o mayor.").default(0),
});

export const createSalesOrderSchema = z.object({
  locationId: z.string().uuid("La ubicacion es invalida."),
  paymentMethod: z.enum(["cash", "card", "transfer"]),
  notes: z.string().max(1000, "Las notas no pueden superar 1000 caracteres.").default(""),
  discountCents: z.coerce.number().int().min(0, "El descuento debe ser cero o mayor.").default(0),
  items: z.array(salesOrderItemSchema).min(1, "Agrega al menos un producto a la venta."),
});

export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>;
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
