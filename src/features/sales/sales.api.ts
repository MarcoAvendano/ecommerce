import type { CreateSalesOrderInput } from "@/features/sales/schemas";
import type {
  CreateSalesOrderResponse,
  CustomerAddressesResponse,
  SalesCreateContextResponse,
  SalesOrderDetailResponse,
  SalesOrderListResponse,
} from "@/features/sales/sales.types";

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Ocurrio un error inesperado.");
  }

  return payload as T;
}

export async function getSalesCreateContext(): Promise<SalesCreateContextResponse> {
  const response = await fetch("/api/sales/create-context", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<SalesCreateContextResponse>(response);
}

export async function createSalesOrder(
  input: CreateSalesOrderInput,
): Promise<CreateSalesOrderResponse> {
  const response = await fetch("/api/sales/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<CreateSalesOrderResponse>(response);
}

export async function listSalesOrders(): Promise<SalesOrderListResponse> {
  const response = await fetch("/api/sales/orders", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<SalesOrderListResponse>(response);
}

export async function getSalesOrderDetail(orderId: string): Promise<SalesOrderDetailResponse> {
  const response = await fetch(`/api/sales/orders/${orderId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<SalesOrderDetailResponse>(response);
}

export async function getCustomerAddresses(
  customerId: string,
): Promise<CustomerAddressesResponse> {
  const response = await fetch(`/api/customers/${customerId}/addresses`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<CustomerAddressesResponse>(response);
}
