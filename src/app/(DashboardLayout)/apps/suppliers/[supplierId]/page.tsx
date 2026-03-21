import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import { SupplierDetailPageClient } from "@/features/suppliers/components/SupplierDetailPageClient";
import { requireAnyRole } from "@/lib/auth";

export default async function SupplierDetailPage(props: { params: Promise<{ supplierId: string }> }) {
  await requireAnyRole(["manager", "inventory"]);
  const { supplierId } = await props.params;

  return (
    <PageContainer title="Detalle del proveedor" description="Consulta proveedores, contactos, compras e ingresos de inventario">
      <>
        <Breadcrumb
          title="Detalle del proveedor"
          subtitle="Administra contactos, compras y recepciones vinculadas al inventario"
          items={[
            { to: "/", title: "Home" },
            { to: "/apps/suppliers", title: "Proveedores" },
            { title: "Detalle" },
          ]}
        />
        <SupplierDetailPageClient supplierId={supplierId} />
      </>
    </PageContainer>
  );
}
