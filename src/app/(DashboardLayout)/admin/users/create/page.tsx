import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import ParentCard from "@/app/components/shared/ParentCard";
import { AdminUserCreateForm } from "@/features/auth/components/AdminUserCreateForm";
import { requireAdmin } from "@/lib/auth";

const breadcrumbItems = [
  {
    to: "/",
    title: "Home",
  },
  {
    to: "/admin/users",
    title: "Usuarios del sistema",
  },
  {
    title: "Crear usuario",
  },
];

export default async function AdminUsersCreatePage() {
  const authContext = await requireAdmin();

  return (
    <PageContainer title="Crear usuario" description="Alta de usuarios internos">
      <>
        <Breadcrumb
          title="Crear usuario"
          subtitle={`Conectado como ${authContext.profile?.full_name ?? authContext.user.email ?? "Administrador"}`}
          items={breadcrumbItems}
        />
        <ParentCard title="Alta de usuarios internos">
          <AdminUserCreateForm />
        </ParentCard>
      </>
    </PageContainer>
  );
}