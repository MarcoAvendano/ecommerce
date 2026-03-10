import type {
  CreateClientAddressInput,
  CreateClientInput,
  UpdateClientAddressInput,
  UpdateClientInput,
} from "@/features/clients/schemas";
import type {
  ClientDetailResponse,
  CreateClientAddressResponse,
  DeleteClientResponse,
  DeleteClientAddressResponse,
  ClientsListResponse,
  CreateClientResponse,
  UpdateClientAddressResponse,
  UpdateClientResponse,
} from "@/features/clients/clients.types";

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Ocurrio un error inesperado.");
  }

  return payload as T;
}

export async function listClients(): Promise<ClientsListResponse> {
  const response = await fetch("/api/clients", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<ClientsListResponse>(response);
}

export async function createClient(
  input: CreateClientInput,
): Promise<CreateClientResponse> {
  const response = await fetch("/api/clients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<CreateClientResponse>(response);
}

export async function updateClient(
  input: UpdateClientInput,
): Promise<UpdateClientResponse> {
  const response = await fetch("/api/clients", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<UpdateClientResponse>(response);
}

export async function deleteClient(id: string): Promise<DeleteClientResponse> {
  const response = await fetch("/api/clients", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  return parseApiResponse<DeleteClientResponse>(response);
}

export async function getClientById(clientId: string): Promise<ClientDetailResponse> {
  const response = await fetch(`/api/clients/${clientId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<ClientDetailResponse>(response);
}

export async function createClientAddress(
  clientId: string,
  input: CreateClientAddressInput,
): Promise<CreateClientAddressResponse> {
  const response = await fetch(`/api/clients/${clientId}/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<CreateClientAddressResponse>(response);
}

export async function updateClientAddress(
  clientId: string,
  input: UpdateClientAddressInput,
): Promise<UpdateClientAddressResponse> {
  const response = await fetch(`/api/clients/${clientId}/addresses`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<UpdateClientAddressResponse>(response);
}

export async function deleteClientAddress(
  clientId: string,
  addressId: string,
): Promise<DeleteClientAddressResponse> {
  const response = await fetch(`/api/clients/${clientId}/addresses`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: addressId }),
  });

  return parseApiResponse<DeleteClientAddressResponse>(response);
}
