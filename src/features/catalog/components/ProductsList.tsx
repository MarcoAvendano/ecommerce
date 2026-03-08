"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ProductCreateDialog } from "@/features/catalog/components/ProductCreateDialog";
import { ProductsTable } from "@/features/catalog/components/ProductsTable";
import {
  useCategoriesQuery,
  useProductsQuery,
} from "@/features/catalog/catalog.queries";
import type { ProductListItem } from "@/features/catalog/catalog.types";

export function ProductsList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const productsQuery = useProductsQuery();
  const categoriesQuery = useCategoriesQuery();

  const categoryOptions = (categoriesQuery.data?.categories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));

  const isLoading = productsQuery.isLoading || categoriesQuery.isLoading;
  const isError = productsQuery.isError || categoriesQuery.isError;
  const errorMessage = productsQuery.error?.message ?? categoriesQuery.error?.message;

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Box>
          <Typography variant="h6">Productos</Typography>
          <Typography variant="body2" color="textSecondary">
            Gestiona el catalogo base con SKU, imagen, estado comercial y categorias opcionales por producto.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
          Nuevo producto
        </Button>
      </Stack>

      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

      {isLoading ? (
        <Stack alignItems="center" py={6} spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="textSecondary">
            Cargando productos y categorias del catalogo...
          </Typography>
        </Stack>
      ) : null}

      {isError ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                productsQuery.refetch();
                categoriesQuery.refetch();
              }}
            >
              Reintentar
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      ) : null}

      {productsQuery.isSuccess && productsQuery.data.products.length === 0 && !isLoading ? (
        <Alert severity="info">No hay productos registrados todavia.</Alert>
      ) : null}

      {productsQuery.isSuccess && productsQuery.data.products.length > 0 && !isLoading ? (
        <ProductsTable products={productsQuery.data.products} onEdit={(product) => setEditingProduct(product)} />
      ) : null}

      <ProductCreateDialog
        open={createDialogOpen}
        categories={categoryOptions}
        onClose={() => setCreateDialogOpen(false)}
        onCompleted={(message) => setSuccessMessage(message)}
      />

      <ProductCreateDialog
        open={Boolean(editingProduct)}
        categories={categoryOptions}
        product={editingProduct}
        mode="edit"
        onClose={() => setEditingProduct(null)}
        onCompleted={(message) => setSuccessMessage(message)}
      />
    </Stack>
  );
}