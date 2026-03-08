import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre de la categoria."),
  slug: z
    .string()
    .trim()
    .min(2, "Ingresa el slug de la categoria.")
    .regex(slugPattern, "Usa solo minusculas, numeros y guiones."),
  description: z.string().max(500, "La descripcion no puede superar 500 caracteres."),
  parentId: z.string().uuid("La categoria padre es invalida.").nullable(),
  sortOrder: z.coerce.number().int().min(0, "El orden debe ser cero o mayor."),
  isActive: z.boolean(),
});

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().uuid("La categoria es invalida."),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del producto."),
  slug: z
    .string()
    .trim()
    .min(2, "Ingresa el slug del producto.")
    .regex(slugPattern, "Usa solo minusculas, numeros y guiones."),
  sku: z.string().trim().min(1, "Ingresa el SKU del producto."),
  description: z.string().max(1000, "La descripcion no puede superar 1000 caracteres."),
  status: z.enum(["draft", "active", "archived"]),
  productType: z.enum(["simple", "variant_parent"]),
  trackInventory: z.boolean(),
  isSellable: z.boolean(),
  isPurchasable: z.boolean(),
  baseUnit: z.string().trim().min(1, "Ingresa la unidad base."),
  imageUrl: z.union([z.string().url("Ingresa una URL valida."), z.literal("")]),
  categoryIds: z.array(z.string().uuid("Selecciona categorias validas.")).default([]),
});

export const updateProductSchema = createProductSchema.extend({
  id: z.string().uuid("El producto es invalido."),
});

export const productDialogSchema = createProductSchema.extend({
  imageFile: z.any().nullable().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductDialogValues = z.infer<typeof productDialogSchema>;