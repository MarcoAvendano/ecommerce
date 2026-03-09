import { ProductEditorInitialData, ProductEditorValues } from "./product-editor.types";
import { CreateProductInput } from "./schemas";

export function getDefaultValues(initialData: ProductEditorInitialData): ProductEditorValues {
  const product = initialData.product;

  if (!product) {
    return {
      name: "",
      slug: "",
      sku: "",
      description: "",
      status: "draft",
      categoryIds: [],
      storeId: null,
      trackInventory: true,
      imageUrl: "",
      imageFile: null,
      additionalImages: [],
      optionGroups: [],
      variants: [],
    };
  }

  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description ?? "",
    status: product.status as ProductEditorValues["status"],
    categoryIds: product.categories.map((category) => category.id),
    storeId: product.storeId,
    trackInventory: product.trackInventory,
    imageUrl: product.imageUrl ?? "",
    imageFile: null,
    additionalImages: product.images.map((image) => ({
      id: image.id,
      publicUrl: image.publicUrl,
      storagePath: image.storagePath,
      altText: image.altText ?? "",
      sortOrder: image.sortOrder,
    })),
    optionGroups: product.optionGroups.map((group) => ({
      id: group.id,
      productId: group.productId,
      name: group.name,
      sortOrder: group.sortOrder,
      values: group.values.map((value) => ({
        id: value.id,
        optionGroupId: value.optionGroupId,
        value: value.value,
        sortOrder: value.sortOrder,
      })),
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode ?? "",
      priceCents: variant.priceCents,
      compareAtPriceCents: variant.compareAtPriceCents,
      costCents: variant.costCents,
      initialStockQty: 0,
      isActive: variant.isActive,
      optionSelections: variant.optionSelections,
    })),
  };
}

export function mapToPayload(values: ProductEditorValues): CreateProductInput {
  return {
    name: values.name,
    slug: values.slug,
    sku: values.sku || `${values.slug}-parent`,
    description: values.description,
    status: values.status,
    productType: "variant_parent",
    brandId: null,
    trackInventory: values.trackInventory,
    isSellable: true,
    isPurchasable: true,
    baseUnit: "unit",
    imageUrl: values.imageUrl,
    initialLocationId: values.storeId,
    categoryIds: values.categoryIds,
    optionGroups: values.optionGroups.map((group) => ({
      id: group.id,
      name: group.name,
      sortOrder: group.sortOrder,
      values: group.values.map((value) => ({
        id: value.id,
        value: value.value,
        sortOrder: value.sortOrder,
      })),
    })),
    variants: values.variants.map((variant, index) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode,
      priceCents: variant.priceCents,
      compareAtPriceCents: variant.compareAtPriceCents,
      costCents: variant.costCents,
      isDefault: index === 0,
      isActive: variant.isActive,
      optionSelections: variant.optionSelections,
      optionValues: variant.optionSelections.map((selection) => ({
        groupId: selection.groupId,
        groupName: selection.groupName,
        valueId: selection.valueId,
        value: selection.value,
      })),
      unitValue: null,
      unitLabel: "",
      packSize: null,
      volumeMl: null,
      abv: null,
      initialStockQty: variant.initialStockQty,
    })),
  };
}