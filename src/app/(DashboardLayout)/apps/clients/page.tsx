import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { ClientsList } from "@/features/clients/components/ClientsList";
import { requireAnyRole } from "@/lib/auth";

const breadcrumbItems = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Clientes",
  },
];

export default async function ClientsPage() {
  const authContext = await requireAnyRole(["manager", "cashier"]);

  return (
    <PageContainer title="Clientes" description="Listado y alta de clientes registrados">
      <>
        <Breadcrumb
          title="Clientes"
          subtitle={`Conectado como ${authContext.profile?.full_name ?? authContext.user.email ?? "Operador"}`}
          items={breadcrumbItems}
        />
        <BlankCard>
          <ClientsList />
        </BlankCard>
      </>
    </PageContainer>
  );
}
