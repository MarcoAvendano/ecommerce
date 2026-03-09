"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import {
  ProductOptionGroupCreateDialog,
  ProductOptionGroupDeleteDialog,
  ProductOptionGroupValueDialog,
} from "@/features/catalog/components/ProductOptionGroupDialogs";
import { ProductVariantDrawer } from "@/features/catalog/components/ProductVariantDrawer";
import {
  useAddProductOptionGroupValueMutation,
  useCreateProductOptionGroupMutation,
  useDeleteProductOptionGroupMutation,
  useDeleteProductVariantMutation,
  useSaveProductVariantMutation,
} from "@/features/catalog/catalog.mutations";
import { useProductDetailQuery } from "@/features/catalog/catalog.queries";
import type { ProductOptionGroupItem } from "@/features/catalog/catalog.types";
import type { ProductVariantDrawerInput } from "@/features/catalog/product-editor.schemas";

interface ProductVariantsManagerPageClientProps {
  productId: string;
}

export function ProductVariantsManagerPageClient({ productId }: ProductVariantsManagerPageClientProps) {
  const productQuery = useProductDetailQuery(productId, true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroupItem[]>([]);
  const [variants, setVariants] = useState<ProductVariantDrawerInput[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addValueGroupId, setAddValueGroupId] = useState<string | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  const createGroupMutation = useCreateProductOptionGroupMutation({
    onSuccess: (result) => {
      setMessage(result.message);
      setOptionGroups(result.optionGroups);
    },
  });
  const addValueMutation = useAddProductOptionGroupValueMutation({
    onSuccess: (result) => {
      setMessage(result.message);
      setOptionGroups(result.optionGroups);
    },
  });
  const deleteGroupMutation = useDeleteProductOptionGroupMutation({
    onSuccess: (result, variables) => {
      setMessage(result.message);
      setOptionGroups(result.optionGroups);
      setVariants((currentVariants) => currentVariants.map((variant) => ({
        ...variant,
        optionSelections: variant.optionSelections.filter((selection) => selection.groupId !== variables.groupId),
      })));
    },
  });
  const saveVariantMutation = useSaveProductVariantMutation({
    onSuccess: (result) => setMessage(result.message),
  });
  const deleteVariantMutation = useDeleteProductVariantMutation({
    onSuccess: (result) => setMessage(result.message),
  });

  const product = productQuery.data?.product;

  useEffect(() => {
    if (!product) {
      return;
    }

    setOptionGroups(product.optionGroups);
    setVariants(
      product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        barcode: variant.barcode ?? "",
        priceCents: variant.priceCents,
        compareAtPriceCents: variant.compareAtPriceCents,
        costCents: variant.costCents,
        initialStockQty: 0,
        isActive: variant.isActive,
        optionSelections: variant.optionSelections,
      })),
    );
  }, [product]);

  const currentVariant = editingVariantIndex !== null ? variants[editingVariantIndex] ?? null : null;
  const addValueGroup = useMemo(
    () => optionGroups.find((group) => group.id === addValueGroupId) ?? null,
    [addValueGroupId, optionGroups],
  );
  const deleteGroup = useMemo(
    () => optionGroups.find((group) => group.id === deleteGroupId) ?? null,
    [deleteGroupId, optionGroups],
  );

  const clearFeedback = () => {
    setMessage(null);
    setLocalError(null);
    createGroupMutation.reset();
    addValueMutation.reset();
    deleteGroupMutation.reset();
    saveVariantMutation.reset();
    deleteVariantMutation.reset();
  };

  const handleCreateGroup = async (value: { name: string; values: Array<{ value: string }> }) => {
    clearFeedback();

    try {
      await createGroupMutation.mutateAsync({
        productId,
        input: value,
      });
      setCreateGroupOpen(false);
      setLocalError(null);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo crear el grupo de opciones.");
    }
  };

  const handleAddGroupValue = async (value: { value: string }) => {
    if (!addValueGroup?.id) {
      return;
    }

    clearFeedback();

    try {
      await addValueMutation.mutateAsync({
        productId,
        groupId: addValueGroup.id,
        input: value,
      });
      setAddValueGroupId(null);
      setLocalError(null);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo agregar la opcion.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroup?.id) {
      return;
    }

    clearFeedback();

    try {
      await deleteGroupMutation.mutateAsync({
        productId,
        groupId: deleteGroup.id,
      });
      setDeleteGroupId(null);
      setLocalError(null);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo eliminar el grupo de opciones.");
    }
  };

  const persistVariant = async (nextVariant: ProductVariantDrawerInput) => {
    setMessage(null);
    setLocalError(null);

    try {
      const result = await saveVariantMutation.mutateAsync({
        productId,
        input: {
          variant: nextVariant,
        },
      });

      setVariants((currentVariants) => {
        if (nextVariant.id) {
          return currentVariants.map((variant) => (variant.id === nextVariant.id ? nextVariant : variant));
        }

        const nextVariants = [...currentVariants];
        const insertedIndex = nextVariants.findIndex((variant) => !variant.id && variant.sku === nextVariant.sku);

        if (insertedIndex >= 0) {
          nextVariants[insertedIndex] = {
            ...nextVariant,
            id: result.variantId,
            initialStockQty: 0,
          };
        }

        return nextVariants;
      });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo guardar la variante.");
    }
  };

  const removeVariant = async (variant: ProductVariantDrawerInput) => {
    if (!variant.id) {
      setVariants((currentVariants) => currentVariants.filter((item) => item !== variant));
      return;
    }

    setMessage(null);
    setLocalError(null);

    try {
      await deleteVariantMutation.mutateAsync({ productId, variantId: variant.id });
      setVariants((currentVariants) => currentVariants.filter((item) => item.id !== variant.id));
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo eliminar la variante.");
    }
  };

  if (productQuery.isLoading) {
    return (
      <Stack alignItems="center" py={8} spacing={2}>
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">Cargando variantes...</Typography>
      </Stack>
    );
  }

  if (productQuery.isError || !product) {
    return <Alert severity="error">{productQuery.error?.message ?? "No se pudo cargar el producto."}</Alert>;
  }

  return (
    <>
      <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Grupos de opciones</Typography>
            {message ? <Alert severity="success">{message}</Alert> : null}
            {localError ? <Alert severity="error">{localError}</Alert> : null}
            {createGroupMutation.error ? <Alert severity="error">{createGroupMutation.error.message}</Alert> : null}
            {addValueMutation.error ? <Alert severity="error">{addValueMutation.error.message}</Alert> : null}
            {deleteGroupMutation.error ? <Alert severity="error">{deleteGroupMutation.error.message}</Alert> : null}
            {saveVariantMutation.error ? <Alert severity="error">{saveVariantMutation.error.message}</Alert> : null}
            {deleteVariantMutation.error ? <Alert severity="error">{deleteVariantMutation.error.message}</Alert> : null}

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre de grupo</TableCell>
                  <TableCell>Opciones</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {optionGroups.length > 0 ? optionGroups.map((group) => (
                  <TableRow key={group.id ?? group.name}>
                    <TableCell sx={{ fontWeight: 600 }}>{group.name}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {group.values.length > 0 ? group.values.map((value) => (
                          <Chip key={value.id ?? `${group.id}-${value.value}`} label={value.value} />
                        )) : <Typography variant="body2" color="text.secondary">Sin opciones</Typography>}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          variant="text"
                          startIcon={<IconPlus size={16} />}
                          onClick={() => {
                            clearFeedback();
                            setAddValueGroupId(group.id ?? null);
                          }}
                        >
                          Agregar opcion
                        </Button>
                        <Button
                          color="error"
                          variant="text"
                          startIcon={<IconTrash size={16} />}
                          onClick={() => {
                            clearFeedback();
                            setDeleteGroupId(group.id ?? null);
                          }}
                        >
                          Eliminar grupo
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary">
                        Todavia no hay grupos de opciones creados para este producto.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Box>
              <Button
                variant="outlined"
                startIcon={<IconPlus size={18} />}
                onClick={() => {
                  clearFeedback();
                  setCreateGroupOpen(true);
                }}
              >
                Agregar grupo de opciones
              </Button>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Typography variant="h5">Variantes</Typography>
              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => {
                  setEditingVariantIndex(null);
                  setDrawerOpen(true);
                }}
              >
                Agregar variante
              </Button>
            </Stack>
            <Alert severity="info">El stock inicial solo se puede definir cuando creas una variante nueva.</Alert>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>SKU</TableCell>
                  {optionGroups.map((group) => (
                    <TableCell key={group.id}>{group.name}</TableCell>
                  ))}
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow key={`${variant.sku}-${index}`}>
                    <TableCell>{variant.name}</TableCell>
                    <TableCell>{variant.sku}</TableCell>
                    {optionGroups.map((group) => {
                      const selection = variant.optionSelections.find((item) => item.groupId === group.id);
                      return <TableCell key={`${variant.sku}-${group.id}`}>{selection?.value ?? "-"}</TableCell>;
                    })}
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton onClick={() => {
                          setEditingVariantIndex(index);
                          setDrawerOpen(true);
                        }}>
                          <IconEdit size={18} />
                        </IconButton>
                        <IconButton color="error" onClick={() => { void removeVariant(variant); }}>
                          <IconTrash size={18} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {variants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={optionGroups.length + 3}>
                      <Typography variant="body2" color="text.secondary">
                        Todavia no hay variantes creadas para este producto.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Stack>
        </Box>

        <ProductVariantDrawer
          open={drawerOpen}
          optionGroups={optionGroups}
          value={currentVariant}
          onClose={() => {
            setDrawerOpen(false);
            setEditingVariantIndex(null);
          }}
          onSubmit={(value) => {
            const nextVariant = editingVariantIndex !== null && variants[editingVariantIndex]
              ? { ...value, id: variants[editingVariantIndex]?.id }
              : value;

            setVariants((currentVariants) => editingVariantIndex !== null
              ? currentVariants.map((variant, index) => (index === editingVariantIndex ? nextVariant : variant))
              : [...currentVariants, nextVariant]);
            setDrawerOpen(false);
            setEditingVariantIndex(null);
            void persistVariant(nextVariant);
          }}
        />
      </Stack>

      <ProductOptionGroupCreateDialog
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSubmit={handleCreateGroup}
        isPending={createGroupMutation.isPending}
        errorMessage={createGroupMutation.error?.message ?? null}
      />

      <ProductOptionGroupValueDialog
        open={Boolean(addValueGroup)}
        group={addValueGroup}
        onClose={() => setAddValueGroupId(null)}
        onSubmit={handleAddGroupValue}
        isPending={addValueMutation.isPending}
        errorMessage={addValueMutation.error?.message ?? null}
      />

      <ProductOptionGroupDeleteDialog
        open={Boolean(deleteGroup)}
        group={deleteGroup}
        onClose={() => setDeleteGroupId(null)}
        onConfirm={handleDeleteGroup}
        isPending={deleteGroupMutation.isPending}
        errorMessage={deleteGroupMutation.error?.message ?? null}
      />
    </>
  );
}
