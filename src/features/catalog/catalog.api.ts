import type {
  CategoriesListResponse,
  CreateCategoryResponse,
  CreateProductResponse,
  InventoryLocationOption,
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
