import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { CategoriesList } from "@/features/catalog/components/CategoriesList";

export default function CategoriesPage() {
  return (
    <PageContainer
      title="Categorias del catalogo"
      description="Listado y alta de categorias del catalogo"
    >
      <Breadcrumb
        title="Categorias"
        subtitle="Gestion del catalogo de categorias"
      />
      <BlankCard>
        <CategoriesList />
      </BlankCard>
    </PageContainer>
  );
}