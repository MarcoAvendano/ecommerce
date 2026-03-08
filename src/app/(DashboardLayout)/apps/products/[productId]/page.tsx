import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { ProductEditorPageClient } from "@/features/catalog/components/ProductEditorPageClient";
import { requireAnyRole } from "@/lib/auth";

export default async function ProductDetailPage(
  props: { params: Promise<{ productId: string }> },
) {
  await requireAnyRole(["manager"]);
  const { productId } = await props.params;

  return (
    <PageContainer title="Editar producto" description="Editar producto del catalogo">
      <Breadcrumb title="Editar producto" subtitle="Configuracion general del producto" items={[{ to: "/apps/products", title: "Productos" }, { title: productId }]} />
      <BlankCard>
        <ProductEditorPageClient mode="edit" productId={productId} />
      </BlankCard>
    </PageContainer>
  );
}
