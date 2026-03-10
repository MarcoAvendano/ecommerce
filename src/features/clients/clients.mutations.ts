import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createClientAddress,
  createClient,
  deleteClientAddress,
  deleteClient,
  updateClientAddress,
  updateClient,
} from "@/features/clients/clients.api";
import {
  clientDetailQueryKey,
  clientsQueryKey,
} from "@/features/clients/clients.queries";

interface CreateClientMutationOptions {
  onSuccess?: Parameters<typeof useMutation>[0] extends never
    ? never
    : (data: Awaited<ReturnType<typeof createClient>>, variables: Parameters<typeof createClient>[0]) => void;
}

interface UpdateClientMutationOptions {
  onSuccess?: Parameters<typeof useMutation>[0] extends never
    ? never
    : (data: Awaited<ReturnType<typeof updateClient>>, variables: Parameters<typeof updateClient>[0]) => void;
}

interface DeleteClientMutationOptions {
  onSuccess?: Parameters<typeof useMutation>[0] extends never
    ? never
    : (data: Awaited<ReturnType<typeof deleteClient>>, variables: Parameters<typeof deleteClient>[0]) => void;
}

interface CreateClientAddressMutationOptions {
  onSuccess?: Parameters<typeof useMutation>[0] extends never
    ? never
    : (
        data: Awaited<ReturnType<typeof createClientAddress>>,
        variables: { clientId: string; input: Parameters<typeof createClientAddress>[1] },
      ) => void;
}

interface UpdateClientAddressMutationOptions {
  onSuccess?: Parameters<typeof useMutation>[0] extends never
    ? never
    : (
        data: Awaited<ReturnType<typeof updateClientAddress>>,
        variables: { clientId: string; input: Parameters<typeof updateClientAddress>[1] },
      ) => void;
}

interface DeleteClientAddressMutationOptions {
  onSuccess?: Parameters<typeof useMutation>[0] extends never
    ? never
    : (
        data: Awaited<ReturnType<typeof deleteClientAddress>>,
        variables: { clientId: string; addressId: string },
      ) => void;
}

export function useCreateClientMutation(options?: CreateClientMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: clientsQueryKey });
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useUpdateClientMutation(options?: UpdateClientMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClient,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: clientsQueryKey });
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useDeleteClientMutation(options?: DeleteClientMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClient,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: clientsQueryKey });
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useCreateClientAddressMutation(options?: CreateClientAddressMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, input }: { clientId: string; input: Parameters<typeof createClientAddress>[1] }) =>
      createClientAddress(clientId, input),
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsQueryKey }),
        queryClient.invalidateQueries({ queryKey: clientDetailQueryKey(variables.clientId) }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useUpdateClientAddressMutation(options?: UpdateClientAddressMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, input }: { clientId: string; input: Parameters<typeof updateClientAddress>[1] }) =>
      updateClientAddress(clientId, input),
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsQueryKey }),
        queryClient.invalidateQueries({ queryKey: clientDetailQueryKey(variables.clientId) }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useDeleteClientAddressMutation(options?: DeleteClientAddressMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, addressId }: { clientId: string; addressId: string }) =>
      deleteClientAddress(clientId, addressId),
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsQueryKey }),
        queryClient.invalidateQueries({ queryKey: clientDetailQueryKey(variables.clientId) }),
      ]);
      options?.onSuccess?.(data, variables);
    },
  });
}
