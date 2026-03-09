"use client";

import { Alert, CircularProgress, Stack, Typography } from "@mui/material";
import { ProductEditorScreen } from "@/features/catalog/components/ProductEditorScreen";
import { useCatalogBootstrapQuery, useProductDetailQuery } from "@/features/catalog/catalog.queries";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";

interface ProductEditorPageClientProps {
  mode: "create" | "edit";
  productId?: string;
}

export function ProductEditorPageClient({ mode, productId }: ProductEditorPageClientProps) {
  const bootstrapQuery = useCatalogBootstrapQuery();
  const productQuery = useProductDetailQuery(productId ?? "", mode === "edit" && Boolean(productId));

  if (bootstrapQuery.isLoading || (mode === "edit" && productQuery.isLoading)) {
    return (
      <Stack alignItems="center" py={8} spacing={2}>
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">
          Cargando editor de producto...
        </Typography>
      </Stack>
    );
  }

  if (bootstrapQuery.isError || (mode === "edit" && productQuery.isError)) {
    return (
      <Alert severity="error">
        {bootstrapQuery.error?.message ?? productQuery.error?.message ?? "No se pudo cargar el editor."}
      </Alert>
    );
  }

  return (
    <ProductEditorScreen
      mode={mode}
      initialData={{
        bootstrap: bootstrapQuery.data!,
        product: mode === "edit" ? (productQuery.data?.product ?? null) : null,
      }}
    />
  );
}
