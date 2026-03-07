import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "../../layout/shared/breadcrumb/Breadcrumb";
import AppCard from "@/app/components/shared/AppCard";

const Sales = () => {
    return (
            <PageContainer title="Sales" description="this is Sales">
                <Breadcrumb title="Sales app" subtitle="List Your Sales" />

            </PageContainer>
    )
}

export default Sales;