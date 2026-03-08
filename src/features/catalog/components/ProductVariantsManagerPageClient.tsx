"use client";

import { useEffect, useState } from "react";
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
import { IconEdit, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import { ProductVariantDrawer } from "@/features/catalog/components/ProductVariantDrawer";
import {
  useDeleteProductVariantMutation,
  useSaveProductOptionGroupsMutation,
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
  const [draftValuesByGroupId, setDraftValuesByGroupId] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const saveOptionGroupsMutation = useSaveProductOptionGroupsMutation({
    onSuccess: (result) => setMessage(result.message),
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

  const currentVariant = editingVariantIndex !== null ? variants[editingVariantIndex] ?? null : null;

  const persistOptionGroups = async (nextOptionGroups: ProductOptionGroupItem[]) => {
    setMessage(null);
    setLocalError(null);

    try {
      const result = await saveOptionGroupsMutation.mutateAsync({
        productId,
        input: {
          optionGroups: nextOptionGroups.map((group) => ({
            id: group.id,
            name: group.name,
            sortOrder: group.sortOrder,
            values: group.values.map((value) => ({
              id: value.id,
              value: value.value,
              sortOrder: value.sortOrder,
            })),
          })),
        },
      });

      setOptionGroups(result.optionGroups);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudieron guardar los grupos de opciones.");
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

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Grupos de opciones</Typography>
          {message ? <Alert severity="success">{message}</Alert> : null}
          {localError ? <Alert severity="error">{localError}</Alert> : null}
          {saveOptionGroupsMutation.error ? <Alert severity="error">{saveOptionGroupsMutation.error.message}</Alert> : null}
          {saveVariantMutation.error ? <Alert severity="error">{saveVariantMutation.error.message}</Alert> : null}
          {deleteVariantMutation.error ? <Alert severity="error">{deleteVariantMutation.error.message}</Alert> : null}
          {optionGroups.map((group, index) => (
            <Stack key={group.id || index} direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel>Opcion</CustomFormLabel>
                <CustomTextField fullWidth size="small" value={group.name} onChange={(event) => {
                  const nextGroups = [...optionGroups];
                  nextGroups[index] = { ...group, name: event.target.value };
                  setOptionGroups(nextGroups);
                }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CustomFormLabel>Valores de opcion</CustomFormLabel>
                <Stack spacing={1.5}>
                  <CustomTextField
                    fullWidth
                    size="small"
                    value={draftValuesByGroupId[group.id ?? `group-${index}`] ?? ""}
                    onChange={(event) => setDraftValuesByGroupId({ ...draftValuesByGroupId, [group.id ?? `group-${index}`]: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") {
                        return;
                      }

                      event.preventDefault();
                      const draftKey = group.id ?? `group-${index}`;
                      const nextValue = (draftValuesByGroupId[draftKey] ?? "").trim();

                      if (!nextValue) {
                        return;
                      }

                      const nextGroups = [...optionGroups];
                      nextGroups[index] = {
                        ...group,
                        values: [
                          ...group.values,
                          {
                            id: `${draftKey}-value-${group.values.length}`,
                            optionGroupId: group.id,
                            value: nextValue,
                            sortOrder: group.values.length,
                          },
                        ],
                      };
                      setOptionGroups(nextGroups);
                      setDraftValuesByGroupId({ ...draftValuesByGroupId, [draftKey]: "" });
                    }}
                    helperText="Presiona Enter para agregar un valor."
                  />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {group.values.map((value) => (
                      <Chip
                        key={value.id}
                        label={value.value}
                        onDelete={() => {
                          const nextGroups = [...optionGroups];
                          nextGroups[index] = {
                            ...group,
                            values: group.values.filter((item) => item.id !== value.id),
                          };
                          setOptionGroups(nextGroups);
                        }}
                        deleteIcon={<IconX size={14} />}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          ))}
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconPlus size={18} />}
              onClick={() => {
                const nextOptionGroups = [
                  ...optionGroups,
                  {
                    id: `local-group-${optionGroups.length}`,
                    productId,
                    name: "",
                    sortOrder: optionGroups.length,
                    values: [],
                  },
                ];
                setOptionGroups(nextOptionGroups);
              }}
            >
              Agregar grupo de opciones
            </Button>
            <Button variant="contained" onClick={() => void persistOptionGroups(optionGroups)}>
              Guardar grupos
            </Button>
          </Stack>
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
  );
}
