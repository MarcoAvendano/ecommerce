import { Typography } from "@mui/material";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import ParentCard from "@/app/components/shared/ParentCard";
import { requireAdmin } from "@/lib/auth";
import { AdminUserCreateForm } from "@/features/auth/components/AdminUserCreateForm";

const breadcrumbItems = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Admin Users",
  },
];

export default async function AdminUsersPage() {
  const authContext = await requireAdmin();

  return (
    <PageContainer title="Admin Users" description="Gestor de usuarios internos">
      <>
        <Breadcrumb
          title="Admin Users"
          subtitle={`Conectado como ${authContext.profile?.full_name ?? authContext.user.email ?? 'Administrador'}`}
          items={breadcrumbItems}
        />
        <ParentCard title="Alta de usuarios internos">
          <>
            <Typography variant="h6" mb={2}>
              Crear acceso para personal operativo
            </Typography>
            <AdminUserCreateForm />
          </>
        </ParentCard>
      </>
    </PageContainer>
  );
}