import { z } from "zod";

export const productOptionSelectionSchema = z.object({
  groupId: z.string().min(1),
  groupName: z.string().min(1),
  valueId: z.string().min(1),
  value: z.string().min(1),
});

export const productVariantDrawerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Ingresa el nombre de la variante."),
  sku: z.string().trim().min(1, "Ingresa el SKU de la variante."),
  barcode: z.string().trim().max(120).optional(),
  priceCents: z.coerce.number().int().min(0, "El precio debe ser cero o mayor."),
  compareAtPriceCents: z.coerce.number().int().min(0).nullable(),
  costCents: z.coerce.number().int().min(0, "El costo debe ser cero o mayor."),
  initialStockQty: z.coerce.number().min(0, "La existencia inicial debe ser cero o mayor."),
  isActive: z.boolean(),
  optionSelections: z.array(productOptionSelectionSchema).default([]),
});

export const productEditorSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del producto."),
  slug: z.string().trim().min(2, "Ingresa el slug del producto."),
  description: z.string().max(1000, "La descripcion no puede superar 1000 caracteres."),
  status: z.enum(["draft", "active", "archived"]),
  categoryIds: z.array(z.string().uuid()).default([]),
  storeId: z.string().uuid("Selecciona una tienda valida.").nullable(),
  trackInventory: z.boolean(),
  imageUrl: z.string().default(""),
  imageFile: z.any().nullable(),
  additionalImages: z.array(
    z.object({
      id: z.string().uuid().optional(),
      publicUrl: z.string().url("La URL del recurso es invalida."),
      storagePath: z.string().optional(),
      altText: z.string().max(200),
      sortOrder: z.coerce.number().int().min(0),
    }),
  ),
  sku: z.string().trim().optional().default(""),
  optionGroups: z.array(
    z.object({
      id: z.string().optional(),
      productId: z.string().optional(),
      name: z.string().trim().min(1),
      sortOrder: z.coerce.number().int().min(0),
      values: z.array(
        z.object({
          id: z.string().optional(),
          optionGroupId: z.string().optional(),
          value: z.string().trim().min(1),
          sortOrder: z.coerce.number().int().min(0),
        }),
      ),
    }),
  ).default([]),
  variants: z.array(productVariantDrawerSchema).min(1, "Agrega al menos una variante."),
});

export type ProductEditorInput = z.infer<typeof productEditorSchema>;
export type ProductVariantDrawerInput = z.infer<typeof productVariantDrawerSchema>;

export const productOptionGroupsPayloadSchema = z.object({
  productId: z.string().uuid(),
  optionGroups: productEditorSchema.shape.optionGroups,
});

export type ProductOptionGroupsPayloadInput = z.infer<typeof productOptionGroupsPayloadSchema>;
