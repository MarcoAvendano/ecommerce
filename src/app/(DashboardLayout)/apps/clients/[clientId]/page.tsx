import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import { ClientDetailPageClient } from "@/features/clients/components/ClientDetailPageClient";
import { requireAnyRole } from "@/lib/auth";

export default async function ClientDetailPage(props: { params: Promise<{ clientId: string }> }) {
  await requireAnyRole(["manager", "cashier"]);
  const { clientId } = await props.params;

  return (
    <PageContainer title="Detalle del cliente" description="Consulta y edicion de clientes registrados">
      <>
        <Breadcrumb
          title="Detalle del cliente"
          subtitle="Consulta informacion general y direcciones registradas"
          items={[
            { to: "/", title: "Home" },
            { to: "/apps/clients", title: "Clientes" },
            { title: "Detalle" },
          ]}
        />
        <ClientDetailPageClient clientId={clientId} />
      </>
    </PageContainer>
  );
}
