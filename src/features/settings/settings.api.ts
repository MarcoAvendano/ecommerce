import type {
  UpdateProfileValues,
  ChangePasswordValues,
  UpdateBusinessValues,
  UpsertLocationValues,
  UpsertPaymentMethodValues,
} from "@/features/settings/schemas";
import type {
  ProfileResponse,
  BusinessResponse,
  LocationsResponse,
  LocationResponse,
  PaymentMethodsResponse,
  PaymentMethodResponse,
  AvatarUploadResponse,
  LogoUploadResponse,
} from "@/features/settings/settings.types";

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Ocurrió un error inesperado.");
  }

  return payload as T;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<ProfileResponse> {
  const response = await fetch("/api/settings/profile");
  return parseApiResponse<ProfileResponse>(response);
}

export async function updateProfile(input: UpdateProfileValues): Promise<{ message: string }> {
  const response = await fetch("/api/settings/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ message: string }>(response);
}

export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/settings/profile/avatar", {
    method: "POST",
    body: formData,
  });
  return parseApiResponse<AvatarUploadResponse>(response);
}

export async function changePassword(input: ChangePasswordValues): Promise<{ message: string }> {
  const response = await fetch("/api/settings/profile/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ message: string }>(response);
}

// ─── Business ─────────────────────────────────────────────────────────────────

export async function getBusiness(): Promise<BusinessResponse> {
  const response = await fetch("/api/settings/business");
  return parseApiResponse<BusinessResponse>(response);
}

export async function updateBusiness(input: UpdateBusinessValues): Promise<{ message: string }> {
  const response = await fetch("/api/settings/business", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ message: string }>(response);
}

export async function uploadLogo(file: File): Promise<LogoUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/settings/business/logo", {
    method: "POST",
    body: formData,
  });
  return parseApiResponse<LogoUploadResponse>(response);
}

// ─── Inventory Locations ───────────────────────────────────────────────────────

export async function listLocations(): Promise<LocationsResponse> {
  const response = await fetch("/api/settings/locations");
  return parseApiResponse<LocationsResponse>(response);
}

export async function createLocation(input: UpsertLocationValues): Promise<LocationResponse> {
  const response = await fetch("/api/settings/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<LocationResponse>(response);
}

export async function updateLocation(
  id: string,
  input: UpsertLocationValues,
): Promise<LocationResponse> {
  const response = await fetch(`/api/settings/locations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<LocationResponse>(response);
}

export async function deleteLocation(id: string): Promise<{ message: string }> {
  const response = await fetch(`/api/settings/locations/${id}`, {
    method: "DELETE",
  });
  return parseApiResponse<{ message: string }>(response);
}

// ─── Payment Methods ───────────────────────────────────────────────────────────

export async function listPaymentMethods(): Promise<PaymentMethodsResponse> {
  const response = await fetch("/api/settings/payment-methods");
  return parseApiResponse<PaymentMethodsResponse>(response);
}

export async function createPaymentMethod(
  input: UpsertPaymentMethodValues,
): Promise<PaymentMethodResponse> {
  const response = await fetch("/api/settings/payment-methods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<PaymentMethodResponse>(response);
}

export async function updatePaymentMethod(
  id: string,
  input: UpsertPaymentMethodValues,
): Promise<PaymentMethodResponse> {
  const response = await fetch(`/api/settings/payment-methods/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<PaymentMethodResponse>(response);
}

export async function deletePaymentMethod(id: string): Promise<{ message: string }> {
  const response = await fetch(`/api/settings/payment-methods/${id}`, {
    method: "DELETE",
  });
  return parseApiResponse<{ message: string }>(response);
}
