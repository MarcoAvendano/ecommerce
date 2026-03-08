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
import { useCategoriesQuery } from "@/features/catalog/catalog.queries";
import { CategoriesTable } from "@/features/catalog/components/CategoriesTable";
import { CategoryCreateDialog } from "@/features/catalog/components/CategoryCreateDialog";
import type { CategoryListItem } from "@/features/catalog/catalog.types";

export function CategoriesList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const categoriesQuery = useCategoriesQuery();

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Box>
          <Typography variant="h6">Categorias</Typography>
          <Typography variant="body2" color="textSecondary">
            Administra la taxonomia del catalogo, jerarquias y estado operativo de cada categoria.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
          Nueva categoria
        </Button>
      </Stack>

      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

      {categoriesQuery.isLoading ? (
        <Stack alignItems="center" py={6} spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="textSecondary">
            Cargando categorias del catalogo...
          </Typography>
        </Stack>
      ) : null}

      {categoriesQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => categoriesQuery.refetch()}>
              Reintentar
            </Button>
          }
        >
          {categoriesQuery.error.message}
        </Alert>
      ) : null}

      {categoriesQuery.isSuccess && categoriesQuery.data.categories.length === 0 ? (
        <Alert severity="info">No hay categorias registradas todavia.</Alert>
      ) : null}

      {categoriesQuery.isSuccess && categoriesQuery.data.categories.length > 0 ? (
        <CategoriesTable
          categories={categoriesQuery.data.categories}
          onEdit={(category) => setEditingCategory(category)}
        />
      ) : null}

      <CategoryCreateDialog
        open={createDialogOpen}
        categories={categoriesQuery.data?.categories ?? []}
        onClose={() => setCreateDialogOpen(false)}
        onCompleted={(message) => setSuccessMessage(message)}
      />

      <CategoryCreateDialog
        open={Boolean(editingCategory)}
        categories={categoriesQuery.data?.categories ?? []}
        category={editingCategory}
        mode="edit"
        onClose={() => setEditingCategory(null)}
        onCompleted={(message) => setSuccessMessage(message)}
      />
    </Stack>
  );
}