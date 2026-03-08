import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { ProductEditorPageClient } from "@/features/catalog/components/ProductEditorPageClient";
import { requireAnyRole } from "@/lib/auth";

export default async function NewProductPage() {
  await requireAnyRole(["manager"]);

  return (
    <PageContainer title="Nuevo producto" description="Crear producto del catalogo">
      <Breadcrumb title="Nuevo producto" subtitle="Configuracion general del producto" items={[{ to: "/apps/products", title: "Productos" }, { title: "Nuevo" }]} />
      <BlankCard>
        <ProductEditorPageClient mode="create" />
      </BlankCard>
    </PageContainer>
  );
}
