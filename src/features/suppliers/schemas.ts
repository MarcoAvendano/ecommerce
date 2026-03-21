import { z } from "zod";

const optionalEmailSchema = z
  .string()
  .trim()
  .max(255, "El correo no puede superar 255 caracteres.")
  .refine((value) => value.length === 0 || z.email().safeParse(value).success, {
    message: "Ingresa un correo valido.",
  });

const optionalText = (max: number, message: string) => z.string().trim().max(max, message);

export const supplierAddressSchema = z.object({
  line1: optionalText(255, "La direccion principal es demasiado larga."),
  line2: optionalText(255, "La direccion secundaria es demasiado larga."),
  city: optionalText(120, "La ciudad es demasiado larga."),
  state: optionalText(120, "El estado es demasiado largo."),
  postalCode: optionalText(20, "El codigo postal es demasiado largo."),
  country: optionalText(120, "El pais es demasiado largo."),
});

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del proveedor."),
  email: optionalEmailSchema,
  phone: optionalText(30, "El telefono no puede superar 30 caracteres."),
  taxId: optionalText(80, "El identificador fiscal es demasiado largo."),
  paymentTermsDays: z.coerce.number().int().min(0, "Los dias de credito deben ser cero o mayores."),
  isActive: z.boolean(),
  address: supplierAddressSchema,
});

export const updateSupplierSchema = createSupplierSchema.extend({
  id: z.string().uuid("El proveedor es invalido."),
});

export const supplierIdSchema = z.string().uuid("El proveedor es invalido.");

export const createSupplierContactSchema = z.object({
  supplierId: supplierIdSchema,
  fullName: z.string().trim().min(2, "Ingresa el nombre del contacto."),
  email: optionalEmailSchema,
  phone: optionalText(30, "El telefono no puede superar 30 caracteres."),
  role: optionalText(80, "El cargo es demasiado largo."),
});

export const updateSupplierContactSchema = createSupplierContactSchema.extend({
  id: z.string().uuid("El contacto es invalido."),
});

export const purchaseOrderStatusSchema = z.enum(["draft", "sent", "partial", "received", "cancelled"]);

export const purchaseOrderItemSchema = z.object({
  id: z.string().uuid("La linea es invalida.").optional(),
  productId: z.string().uuid("El producto es invalido."),
  variantId: z.string().uuid("La variante es invalida.").nullable().default(null),
  orderedQty: z.coerce.number().positive("La cantidad solicitada debe ser mayor a cero."),
  unitCostCents: z.coerce.number().int().min(0, "El costo debe ser cero o mayor."),
  taxRate: z.coerce.number().min(0, "El impuesto debe ser cero o mayor.").max(100, "El impuesto no puede superar 100."),
  supplierSku: optionalText(120, "El SKU del proveedor es demasiado largo.").default(""),
});

const purchaseOrderBaseSchema = z.object({
  supplierId: supplierIdSchema,
  status: z.enum(["draft", "sent", "cancelled"]),
  orderedAt: z.string().datetime("La fecha de orden es invalida."),
  expectedAt: z.union([z.string().datetime("La fecha esperada es invalida."), z.literal("")]).default(""),
  discountCents: z.coerce.number().int().min(0, "El descuento debe ser cero o mayor."),
  notes: z.string().trim().max(1000, "Las notas no pueden superar 1000 caracteres."),
  items: z.array(purchaseOrderItemSchema).min(1, "Agrega al menos un producto a la orden de compra."),
});

export const createPurchaseOrderSchema = purchaseOrderBaseSchema;

export const updatePurchaseOrderSchema = purchaseOrderBaseSchema.extend({
  id: z.string().uuid("La orden de compra es invalida."),
});

export const purchaseOrderIdSchema = z.string().uuid("La orden de compra es invalida.");

export const purchaseOrderReceiptItemSchema = z.object({
  purchaseOrderItemId: z.string().uuid("La linea de compra es invalida."),
  receivedQty: z.coerce.number().positive("La cantidad recibida debe ser mayor a cero."),
});

export const receivePurchaseOrderSchema = z.object({
  locationId: z.string().uuid("La ubicacion es invalida."),
  notes: z.string().trim().max(1000, "Las notas no pueden superar 1000 caracteres.").default(""),
  items: z.array(purchaseOrderReceiptItemSchema).min(1, "Agrega al menos una linea a la recepcion."),
});

export type SupplierAddressInput = z.infer<typeof supplierAddressSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateSupplierContactInput = z.infer<typeof createSupplierContactSchema>;
export type UpdateSupplierContactInput = z.infer<typeof updateSupplierContactSchema>;
export type PurchaseOrderStatusInput = z.infer<typeof purchaseOrderStatusSchema>;
export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;
