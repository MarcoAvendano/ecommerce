import { useQuery } from "@tanstack/react-query";
import {
  getProfile,
  getBusiness,
  listLocations,
  listPaymentMethods,
} from "@/features/settings/settings.api";
import {
  profileQueryKey,
  businessQueryKey,
  locationsQueryKey,
  paymentMethodsQueryKey,
} from "@/features/settings/settings.query-keys";

export { profileQueryKey, businessQueryKey, locationsQueryKey, paymentMethodsQueryKey };

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
