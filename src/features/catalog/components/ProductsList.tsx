"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ProductsTable } from "@/features/catalog/components/ProductsTable";
import {
  useCategoriesQuery,
  useProductsQuery,
} from "@/features/catalog/catalog.queries";

export function ProductsList() {
  const productsQuery = useProductsQuery();
  const categoriesQuery = useCategoriesQuery();

  const isLoading = productsQuery.isLoading || categoriesQuery.isLoading;
  const isError = productsQuery.isError || categoriesQuery.isError;
  const errorMessage = productsQuery.error?.message ?? categoriesQuery.error?.message;

  return (
    <Stack spacing={1} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="flex-end"
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Button component={Link} href="/apps/products/new" variant="contained">
          Nuevo producto
        </Button>
      </Stack>

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
        <ProductsTable products={productsQuery.data.products} />
      ) : null}
    </Stack>
  );
}
