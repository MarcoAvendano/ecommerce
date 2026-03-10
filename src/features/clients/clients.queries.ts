import { useQuery } from "@tanstack/react-query";
import {
  getClientById,
  listClients,
} from "@/features/clients/clients.api";

export const clientsQueryKey = ["clients"] as const;

export const clientDetailQueryKey = (clientId: string) => [...clientsQueryKey, "detail", clientId] as const;

export function useClientsQuery() {
  return useQuery({
    queryKey: clientsQueryKey,
    queryFn: listClients,
  });
}

export function useClientDetailQuery(clientId: string, enabled = true) {
  return useQuery({
    queryKey: clientDetailQueryKey(clientId),
    queryFn: () => getClientById(clientId),
    enabled,
  });
}
