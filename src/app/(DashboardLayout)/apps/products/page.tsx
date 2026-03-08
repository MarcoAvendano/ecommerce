import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { ProductsList } from "@/features/catalog/components/ProductsList";
import { requireAnyRole } from "@/lib/auth";

export default async function ProductsPage() {
  await requireAnyRole(["manager"]);

  return (
    <PageContainer
      title="Productos del catalogo"
      description="Listado y alta de productos del catalogo"
    >
      <Breadcrumb
        title="Productos"
        subtitle="Gestion del catalogo de productos"
      />
      <BlankCard>
        <ProductsList />
      </BlankCard>
    </PageContainer>
  );
}
