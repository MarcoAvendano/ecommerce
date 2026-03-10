import { useQuery } from "@tanstack/react-query";
import {
  getProfile,
  getBusiness,
  listLocations,
  listPaymentMethods,
} from "@/features/settings/settings.api";

export const profileQueryKey = ["settings", "profile"] as const;
export const businessQueryKey = ["settings", "business"] as const;
export const locationsQueryKey = ["settings", "locations"] as const;
export const paymentMethodsQueryKey = ["settings", "payment-methods"] as const;

export function useProfileQuery() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: getProfile,
  });
}

export function useBusinessQuery() {
  return useQuery({
    queryKey: businessQueryKey,
    queryFn: getBusiness,
  });
}

export function useLocationsQuery() {
  return useQuery({
    queryKey: locationsQueryKey,
    queryFn: listLocations,
  });
}

export function usePaymentMethodsQuery() {
  return useQuery({
    queryKey: paymentMethodsQueryKey,
    queryFn: listPaymentMethods,
  });
}
