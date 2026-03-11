import type { QueryClient } from "@tanstack/react-query";
import { getAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { profileQueryKey, businessQueryKey } from "@/features/settings/settings.query-keys";
import type { ProfileResponse, BusinessResponse } from "@/features/settings/settings.types";

export async function prefetchDashboardData(queryClient: QueryClient): Promise<void> {
  const authContext = await getAuthContext();

  if (!authContext) {
    return;
  }

  const supabase = await createClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: profileQueryKey,
      queryFn: async (): Promise<ProfileResponse> => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url, status")
          .eq("id", authContext.user.id)
          .maybeSingle();

        return {
          profile: profile
            ? { ...profile, isAdmin: authContext.isAdmin }
            : null,
        };
      },
    }),

    queryClient.prefetchQuery({
      queryKey: businessQueryKey,
      queryFn: async (): Promise<BusinessResponse> => {
        const { data } = await supabase
          .from("business_settings")
          .select("id, name, logo_url")
          .maybeSingle();

        return { business: data };
      },
    }),
  ]);
}
