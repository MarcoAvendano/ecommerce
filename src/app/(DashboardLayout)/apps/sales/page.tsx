import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { SalesOrderCreateForm } from "@/features/sales/components/SalesOrderCreateForm";
import { requireAnyRole } from "@/lib/auth";

const breadcrumbItems = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Ventas",
  },
];

export default async function SalesPage() {
  const authContext = await requireAnyRole(["manager", "cashier"]);

  return (
    <PageContainer title="Ventas" description="Registro de ventas POS">
      <Breadcrumb
        title="Ventas"
        subtitle={`Conectado como ${authContext.profile?.full_name ?? authContext.user.email ?? "Operador"}`}
        items={breadcrumbItems}
      />
      <BlankCard>
        <SalesOrderCreateForm />
      </BlankCard>
    </PageContainer>
  );
}
