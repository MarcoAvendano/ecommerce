import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import ParentCard from "@/app/components/shared/ParentCard";
import { requireAdmin } from "@/lib/auth";
import { AdminUsersList } from "@/features/auth/components/AdminUsersList";

const breadcrumbItems = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Usuarios del sistema",
  },
];

interface AdminUsersPageProps {
  searchParams?: {
    created?: string;
  };
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const authContext = await requireAdmin();
  const showCreatedMessage = searchParams?.created === "1";

  return (
    <PageContainer title="Usuarios del sistema" description="Gestor de usuarios internos">
      <>
        <Breadcrumb
          title="Usuarios del sistema"
          subtitle={`Conectado como ${authContext.profile?.full_name ?? authContext.user.email ?? 'Administrador'}`}
          items={breadcrumbItems}
        />
        <ParentCard title="Listado de usuarios internos">
          <AdminUsersList showCreatedMessage={showCreatedMessage} />
        </ParentCard>
      </>
    </PageContainer>
  );
}