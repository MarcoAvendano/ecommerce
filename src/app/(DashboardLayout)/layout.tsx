import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query/query-client";
import { prefetchDashboardData } from "@/lib/prefetch/dashboard-prefetch";
import { DashboardShell } from "./DashboardShell";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  await prefetchDashboardData(queryClient);
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <DashboardShell>{children}</DashboardShell>
    </HydrationBoundary>
  );
}
