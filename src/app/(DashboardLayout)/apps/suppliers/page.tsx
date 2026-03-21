import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { SuppliersList } from "@/features/suppliers/components/SuppliersList";
import { requireAnyRole } from "@/lib/auth";

const breadcrumbItems = [
  { to: "/", title: "Home" },
  { title: "Proveedores" },
];

export default async function SuppliersPage() {
  const authContext = await requireAnyRole(["manager", "inventory"]);

  return (
    <PageContainer title="Proveedores" description="Gestion de proveedores, compras e ingresos de inventario">
      <>
        <Breadcrumb
          title="Proveedores"
          subtitle={`Conectado como ${authContext.profile?.full_name ?? authContext.user.email ?? "Operador"}`}
          items={breadcrumbItems}
        />
        <BlankCard>
          <SuppliersList />
        </BlankCard>
      </>
    </PageContainer>
  );
}
