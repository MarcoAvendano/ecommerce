import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionValuesSchema = z
  .array(
    z.union([
      z.object({
        key: z.string().trim().min(1, "Ingresa el nombre del atributo."),
        value: z.string().trim().min(1, "Ingresa el valor del atributo."),
      }),
      z.object({
        groupId: z.string().uuid("Selecciona un grupo de opcion valido."),
        groupName: z.string().trim().min(1, "Ingresa el nombre del grupo de opciones."),
        valueId: z.string().uuid("Selecciona un valor de opcion valido."),
        value: z.string().trim().min(1, "Ingresa el valor del atributo."),
      }),
    ]),
  )
  .default([]);

const productOptionSelectionSchema = z.object({
  groupId: z.string().min(1, "Selecciona un grupo de opcion valido."),
  groupName: z.string().trim().min(1, "Ingresa el nombre del grupo de opciones."),
  valueId: z.string().min(1, "Selecciona un valor de opcion valido."),
  value: z.string().trim().min(1, "Ingresa el valor del atributo."),
});

export const productVariantSchema = z.object({
  id: z.string().uuid("La variante es invalida.").optional(),
  name: z.string().trim().min(1, "Ingresa el nombre de la variante."),
  sku: z.string().trim().min(1, "Ingresa el SKU de la variante."),
  barcode: z.string().trim().max(120, "El codigo de barras es demasiado largo.").optional(),
  priceCents: z.coerce.number().int().min(0, "El precio debe ser cero o mayor."),
  compareAtPriceCents: z.coerce
    .number()
    .int()
    .min(0, "El precio de comparacion debe ser cero o mayor.")
    .nullable(),
  costCents: z.coerce.number().int().min(0, "El costo debe ser cero o mayor."),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  optionSelections: z.array(productOptionSelectionSchema).default([]),
  optionValues: optionValuesSchema,
  unitValue: z.coerce.number().positive("El valor por unidad debe ser mayor a cero.").nullable(),
  unitLabel: z.string().trim().max(50, "La unidad es demasiado larga.").optional(),
  packSize: z.coerce.number().int().positive("El multipack debe ser mayor a cero.").nullable(),
  volumeMl: z.coerce.number().int().positive("El volumen debe ser mayor a cero.").nullable(),
  abv: z.coerce.number().min(0, "El ABV debe ser cero o mayor.").max(100, "El ABV no puede superar 100.").nullable(),
  initialStockQty: z.coerce.number().min(0, "La existencia inicial debe ser cero o mayor.").default(0),
});

function normalizeProductInput(payload: Record<string, unknown>) {
  return {
    ...payload,
    categoryIds: Array.isArray(payload.categoryIds) ? payload.categoryIds : [],
    variants: Array.isArray(payload.variants) ? payload.variants : [],
  };
}

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

export const createProductSchema = z
  .object({
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
    brandId: z.string().uuid("Selecciona una marca valida.").nullable().default(null),
    trackInventory: z.boolean(),
    isSellable: z.boolean(),
    isPurchasable: z.boolean(),
    baseUnit: z.string().trim().min(1, "Ingresa la unidad base."),
    imageUrl: z.union([z.string().url("Ingresa una URL valida."), z.literal("")]),
    initialLocationId: z.string().uuid("Selecciona una ubicacion valida.").nullable(),
    categoryIds: z.array(z.string().uuid("Selecciona categorias validas.")).default([]),
    optionGroups: z.array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1, "Ingresa el nombre del grupo de opciones."),
        sortOrder: z.coerce.number().int().min(0).default(0),
        values: z.array(
          z.object({
            id: z.string().optional(),
            value: z.string().trim().min(1, "Ingresa un valor para el grupo de opciones."),
            sortOrder: z.coerce.number().int().min(0).default(0),
          }),
        ).default([]),
      }),
    ).default([]),
    variants: z.array(productVariantSchema).min(1, "Agrega al menos una variante."),
  })
  .superRefine((value, context) => {
    const defaultVariants = value.variants.filter((variant) => variant.isDefault);

    if (defaultVariants.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe existir exactamente una variante principal.",
        path: ["variants"],
      });
    }

    if (value.productType === "simple" && value.variants.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Los productos simples deben tener una sola variante.",
        path: ["variants"],
      });
    }

    if (value.trackInventory && !value.initialLocationId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona una ubicacion inicial para cargar inventario.",
        path: ["initialLocationId"],
      });
    }

    const seenSkus = new Set<string>();

    value.variants.forEach((variant, index) => {
      const normalizedSku = variant.sku.trim().toLowerCase();

      if (seenSkus.has(normalizedSku)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cada variante debe tener un SKU unico.",
          path: ["variants", index, "sku"],
        });
      }

      seenSkus.add(normalizedSku);

      if (
        variant.compareAtPriceCents !== null &&
        variant.compareAtPriceCents < variant.priceCents
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El precio de comparacion no puede ser menor al precio de venta.",
          path: ["variants", index, "compareAtPriceCents"],
        });
      }
    });
  });

export const updateProductSchema = createProductSchema.extend({
  id: z.string().uuid("El producto es invalido."),
});

export const productDialogSchema = createProductSchema.extend({
  imageFile: z.any().nullable().optional(),
});

export const createProductRequestSchema = z.preprocess(
  (payload) => normalizeProductInput((payload ?? {}) as Record<string, unknown>),
  createProductSchema,
);

export const updateProductRequestSchema = z.preprocess(
  (payload) => normalizeProductInput((payload ?? {}) as Record<string, unknown>),
  updateProductSchema,
);

export const addGroupSchema = z.object({
  name: z.string().trim().min(1, "Ingresa el nombre del grupo de opciones."),
  values: z
    .array(z.object({ value: z.string().trim().min(1, "Ingresa un valor para la opcion.") }))
    .min(1, "Agrega al menos una opcion."),
});

export const addValueSchema = z.object({
  value: z.string().trim().min(1, "Ingresa el valor de la opcion."),
});

export type AddGroupFormValues = z.infer<typeof addGroupSchema>;
export type AddValueFormValues = z.infer<typeof addValueSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductDialogValues = z.infer<typeof productDialogSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
