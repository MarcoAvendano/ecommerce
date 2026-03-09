import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { requireAnyRole } from "@/lib/auth";
import { ProductVariantsManagerPageClient } from "@/features/catalog/components/ProductVariantsManagerPageClient";

export default async function ProductVariantsPage(props: { params: Promise<{ productId: string }> }) {
  await requireAnyRole(["manager"]);
  const { productId } = await props.params;

  return (
    <PageContainer title="Gestionar variantes" description="Grupos de opciones y variantes del producto">
      <Breadcrumb
        title="Gestionar variantes"
        subtitle="Configuracion avanzada de variantes"
        items={[
          { to: "/apps/products", title: "Productos" },
          { to: `/apps/products/${productId}`, title: "Producto" },
          { title: "Variantes" },
        ]}
      />
      <BlankCard>
        <ProductVariantsManagerPageClient productId={productId} />
      </BlankCard>
    </PageContainer>
  );
}
