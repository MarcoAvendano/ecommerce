import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateProfile,
  uploadAvatar,
  changePassword,
  updateBusiness,
  uploadLogo,
  createLocation,
  updateLocation,
  deleteLocation,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/features/settings/settings.api";
import {
  profileQueryKey,
  businessQueryKey,
  locationsQueryKey,
  paymentMethodsQueryKey,
} from "@/features/settings/settings.queries";
import type {
  UpsertLocationValues,
  UpsertPaymentMethodValues,
} from "@/features/settings/schemas";

// ─── Profile mutations ────────────────────────────────────────────────────────

export function useUpdateProfileMutation(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      options?.onSuccess?.();
    },
  });
}

export function useUploadAvatarMutation(options?: {
  onSuccess?: (avatarUrl: string) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      options?.onSuccess?.(data.avatarUrl);
    },
  });
}

export function useChangePasswordMutation(options?: {
  onSuccess?: () => void;
}) {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      options?.onSuccess?.();
    },
  });
}

// ─── Business mutations ───────────────────────────────────────────────────────

export function useUpdateBusinessMutation(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusiness,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: businessQueryKey });
      options?.onSuccess?.();
    },
  });
}

export function useUploadLogoMutation(options?: {
  onSuccess?: (logoUrl: string) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadLogo(file),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: businessQueryKey });
      options?.onSuccess?.(data.logoUrl);
    },
  });
}

// ─── Location mutations ───────────────────────────────────────────────────────

export function useCreateLocationMutation(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: locationsQueryKey });
      options?.onSuccess?.();
    },
  });
}

export function useUpdateLocationMutation(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpsertLocationValues }) =>
      updateLocation(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: locationsQueryKey });
      options?.onSuccess?.();
    },
  });
}

export function useDeleteLocationMutation(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: locationsQueryKey });
      options?.onSuccess?.();
    },
  });
}

// ─── Payment method mutations ─────────────────────────────────────────────────

export function useCreatePaymentMethodMutation(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPaymentMethod,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
      options?.onSuccess?.();
    },
  });
}

export function useUpdatePaymentMethodMutation(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpsertPaymentMethodValues }) =>
      updatePaymentMethod(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
      options?.onSuccess?.();
    },
  });
}

export function useDeletePaymentMethodMutation(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
      options?.onSuccess?.();
    },
  });
}
