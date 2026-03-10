import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { SalesList } from "@/features/sales/components/SalesList";
import { requireAnyRole } from "@/lib/auth";

export default async function SalesListPage() {
    await requireAnyRole(["manager", "cashier"]);

    return (
        <PageContainer
            title="Ventas"
            description="Listado de ventas realizadas en el sistema"
        >
            <Breadcrumb
                title="Ventas"
                subtitle="Listado de ventas realizadas"
            />
            <BlankCard>
                <SalesList />
            </BlankCard>
        </PageContainer>
    );
}