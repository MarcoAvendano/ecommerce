import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import { SalesOrderDetailPageClient } from "@/features/sales/components/SalesOrderDetailPageClient";
import { requireAnyRole } from "@/lib/auth";

export default async function SalesOrderDetailPage(props: { params: Promise<{ orderId: string }> }) {
  await requireAnyRole(["manager", "cashier"]);
  const { orderId } = await props.params;

  return (
    <PageContainer title="Detalle de orden" description="Detalle e impresion de una orden de venta">
      <div className="screen-only">
        <Breadcrumb
          title="Detalle de orden"
          subtitle="Consulta la orden registrada e imprime su comprobante"
        />
      </div>
      <SalesOrderDetailPageClient orderId={orderId} />
    </PageContainer>
  );
}