import type { CreateSalesOrderInput } from "@/features/sales/schemas";
import type {
  CreateSalesOrderResponse,
  SalesCreateContextResponse,
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
