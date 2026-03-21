import type {
  CreatePurchaseOrderInput,
  CreateSupplierContactInput,
  CreateSupplierInput,
  ReceivePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  UpdateSupplierContactInput,
  UpdateSupplierInput,
} from "@/features/suppliers/schemas";
import type {
  DeleteSupplierContactResponse,
  DeleteSupplierResponse,
  PurchaseCreateContextResponse,
  PurchaseOrderDetailResponse,
  PurchaseOrderMutationResponse,
  PurchaseOrderReceiptResponse,
  PurchaseOrdersListResponse,
  SupplierContactMutationResponse,
  SupplierDetailResponse,
  SupplierMutationResponse,
  SuppliersListResponse,
} from "@/features/suppliers/suppliers.types";

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Ocurrio un error inesperado.");
  }

  return payload as T;
}

export async function listSuppliers(): Promise<SuppliersListResponse> {
  const response = await fetch("/api/suppliers", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return parseApiResponse<SuppliersListResponse>(response);
}

export async function getSupplierById(supplierId: string): Promise<SupplierDetailResponse> {
  const response = await fetch(`/api/suppliers/${supplierId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return parseApiResponse<SupplierDetailResponse>(response);
}

export async function createSupplier(input: CreateSupplierInput): Promise<SupplierMutationResponse> {
  const response = await fetch("/api/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseApiResponse<SupplierMutationResponse>(response);
}

export async function updateSupplier(input: UpdateSupplierInput): Promise<SupplierMutationResponse> {
  const response = await fetch("/api/suppliers", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseApiResponse<SupplierMutationResponse>(response);
}

export async function deleteSupplier(id: string): Promise<DeleteSupplierResponse> {
  const response = await fetch("/api/suppliers", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  return parseApiResponse<DeleteSupplierResponse>(response);
}

export async function createSupplierContact(
  supplierId: string,
  input: CreateSupplierContactInput,
): Promise<SupplierContactMutationResponse> {
  const response = await fetch(`/api/suppliers/${supplierId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseApiResponse<SupplierContactMutationResponse>(response);
}

export async function updateSupplierContact(
  supplierId: string,
  input: UpdateSupplierContactInput,
): Promise<SupplierContactMutationResponse> {
  const response = await fetch(`/api/suppliers/${supplierId}/contacts`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseApiResponse<SupplierContactMutationResponse>(response);
}

export async function deleteSupplierContact(
  supplierId: string,
  id: string,
): Promise<DeleteSupplierContactResponse> {
  const response = await fetch(`/api/suppliers/${supplierId}/contacts`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  return parseApiResponse<DeleteSupplierContactResponse>(response);
}

export async function listPurchaseOrders(supplierId?: string): Promise<PurchaseOrdersListResponse> {
  const search = supplierId ? `?supplierId=${supplierId}` : "";
  const response = await fetch(`/api/purchases/orders${search}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return parseApiResponse<PurchaseOrdersListResponse>(response);
}

export async function getPurchaseCreateContext(mode: "create" | "receipt" = "create"): Promise<PurchaseCreateContextResponse> {
  const response = await fetch(`/api/purchases/create-context?mode=${mode}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return parseApiResponse<PurchaseCreateContextResponse>(response);
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrderMutationResponse> {
  const response = await fetch("/api/purchases/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseApiResponse<PurchaseOrderMutationResponse>(response);
}

export async function getPurchaseOrderById(
  orderId: string,
  options?: { includeMovements?: boolean },
): Promise<PurchaseOrderDetailResponse> {
  const search = options?.includeMovements === false ? "?includeMovements=false" : "";
  const response = await fetch(`/api/purchases/orders/${orderId}${search}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return parseApiResponse<PurchaseOrderDetailResponse>(response);
}

export async function updatePurchaseOrder(input: UpdatePurchaseOrderInput): Promise<PurchaseOrderMutationResponse> {
  const response = await fetch(`/api/purchases/orders/${input.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseApiResponse<PurchaseOrderMutationResponse>(response);
}

export async function receivePurchaseOrder(
  orderId: string,
  input: ReceivePurchaseOrderInput,
): Promise<PurchaseOrderReceiptResponse> {
  const response = await fetch(`/api/purchases/orders/${orderId}/receive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseApiResponse<PurchaseOrderReceiptResponse>(response);
}
