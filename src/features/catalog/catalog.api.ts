import type {
  AddProductOptionGroupValuePayload,
  CategoriesListResponse,
  CreateProductOptionGroupPayload,
  CreateCategoryResponse,
  CreateProductResponse,
  DeleteProductVariantResponse,
  InventoryLocationOption,
  ProductEditorBootstrapResponse,
  ProductListItem,
  ProductOptionGroupsResponse,
  SaveProductVariantPayload,
  SaveProductVariantResponse,
  UpdateCategoryResponse,
  UpdateProductResponse,
  UploadProductImageResponse,
  ProductsListResponse,
} from "@/features/catalog/catalog.types";
import type {
  CreateCategoryInput,
  CreateProductInput,
  UpdateCategoryInput,
  UpdateProductInput,
} from "@/features/catalog/schemas";

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Ocurrio un error inesperado.");
  }

  return payload as T;
}

export async function listCategories(): Promise<CategoriesListResponse> {
  const response = await fetch("/api/catalog/categories", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<CategoriesListResponse>(response);
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<CreateCategoryResponse> {
  const response = await fetch("/api/catalog/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<CreateCategoryResponse>(response);
}

export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<UpdateCategoryResponse> {
  const response = await fetch("/api/catalog/categories", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<UpdateCategoryResponse>(response);
}

export async function listProducts(): Promise<ProductsListResponse> {
  const response = await fetch("/api/catalog/products", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<ProductsListResponse>(response);
}

export async function listInventoryLocations(): Promise<{ locations: InventoryLocationOption[] }> {
  const response = await fetch("/api/sales/create-context", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = await parseApiResponse<{ locations: InventoryLocationOption[] } & Record<string, unknown>>(response);

  return {
    locations: payload.locations,
  };
}

export async function getProductEditorBootstrap(): Promise<ProductEditorBootstrapResponse> {
  const response = await fetch("/api/catalog/bootstrap", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<ProductEditorBootstrapResponse>(response);
}

export async function createProductOptionGroup(
  productId: string,
  input: CreateProductOptionGroupPayload,
): Promise<ProductOptionGroupsResponse> {
  const response = await fetch(`/api/catalog/products/${productId}/option-groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<ProductOptionGroupsResponse>(response);
}

export async function addProductOptionGroupValue(
  productId: string,
  groupId: string,
  input: AddProductOptionGroupValuePayload,
): Promise<ProductOptionGroupsResponse> {
  const response = await fetch(`/api/catalog/products/${productId}/option-groups/${groupId}/values`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<ProductOptionGroupsResponse>(response);
}

export async function deleteProductOptionGroup(
  productId: string,
  groupId: string,
): Promise<ProductOptionGroupsResponse> {
  const response = await fetch(`/api/catalog/products/${productId}/option-groups/${groupId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<ProductOptionGroupsResponse>(response);
}

export async function saveProductVariant(
  productId: string,
  input: SaveProductVariantPayload,
): Promise<SaveProductVariantResponse> {
  const response = await fetch(`/api/catalog/products/${productId}/variants`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<SaveProductVariantResponse>(response);
}

export async function deleteProductVariant(
  productId: string,
  variantId: string,
): Promise<DeleteProductVariantResponse> {
  const response = await fetch(`/api/catalog/products/${productId}/variants`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ variantId }),
  });

  return parseApiResponse<DeleteProductVariantResponse>(response);
}

export async function getProductById(productId: string): Promise<{ product: ProductListItem }> {
  const response = await fetch(`/api/catalog/products/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<{ product: ProductListItem }>(response);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<CreateProductResponse> {
  const response = await fetch("/api/catalog/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<CreateProductResponse>(response);
}

export async function updateProduct(
  input: UpdateProductInput,
): Promise<UpdateProductResponse> {
  const response = await fetch("/api/catalog/products", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<UpdateProductResponse>(response);
}

export async function uploadProductImage(
  file: File,
  slug: string,
): Promise<UploadProductImageResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("slug", slug);

  const response = await fetch("/api/catalog/product-images", {
    method: "POST",
    body: formData,
  });

  return parseApiResponse<UploadProductImageResponse>(response);
}
