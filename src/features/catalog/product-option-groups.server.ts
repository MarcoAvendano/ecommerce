import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductOptionGroupItem, ProductOptionGroupValueItem } from "@/features/catalog/catalog.types";
import type { Json } from "../../../types/supabase";

type AdminClient = ReturnType<typeof createAdminClient>;

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function mapOptionGroupItems(
  groups: Array<{ id: string; product_id: string; name: string; sort_order: number }>,
  values: Array<{ id: string; option_group_id: string; value: string; sort_order: number }>,
) {
  const valuesByGroupId = new Map<string, ProductOptionGroupValueItem[]>();

  for (const value of values) {
    const currentValues = valuesByGroupId.get(value.option_group_id) ?? [];
    currentValues.push({
      id: value.id,
      optionGroupId: value.option_group_id,
      value: value.value,
      sortOrder: value.sort_order,
    });
    valuesByGroupId.set(value.option_group_id, currentValues);
  }

  return groups.map<ProductOptionGroupItem>((group) => ({
    id: group.id,
    productId: group.product_id,
    name: group.name,
    sortOrder: group.sort_order,
    values: valuesByGroupId.get(group.id) ?? [],
  }));
}

export async function loadProductOptionGroups(adminClient: AdminClient, productId: string) {
  const [{ data: groups, error: groupsError }, { data: values, error: valuesError }] = await Promise.all([
    adminClient
      .from("product_option_groups")
      .select("id, product_id, name, sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true }),
    adminClient
      .from("product_option_group_values")
      .select("id, option_group_id, value, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (groupsError || valuesError) {
    return {
      error: groupsError ?? valuesError ?? new Error("No se pudieron cargar los grupos de opciones."),
      optionGroups: [],
    };
  }

  const groupIds = new Set((groups ?? []).map((group) => group.id));
  const filteredValues = (values ?? []).filter((value) => groupIds.has(value.option_group_id));

  return {
    error: null,
    optionGroups: mapOptionGroupItems(groups ?? [], filteredValues),
  };
}

export async function getOptionGroupById(adminClient: AdminClient, productId: string, groupId: string) {
  const { data, error } = await adminClient
    .from("product_option_groups")
    .select("id, product_id, name, sort_order")
    .eq("id", groupId)
    .eq("product_id", productId)
    .maybeSingle();

  return {
    error,
    optionGroup: data,
  };
}

export async function hasOptionGroupNameConflict(
  adminClient: AdminClient,
  productId: string,
  groupName: string,
) {
  const { optionGroups, error } = await loadProductOptionGroups(adminClient, productId);

  if (error) {
    return { error, conflict: false, optionGroups: [] as ProductOptionGroupItem[] };
  }

  const normalizedGroupName = normalizeText(groupName);

  return {
    error: null,
    conflict: optionGroups.some((group) => normalizeText(group.name) === normalizedGroupName),
    optionGroups,
  };
}

export async function hasOptionGroupValueConflict(
  adminClient: AdminClient,
  groupId: string,
  value: string,
) {
  const { data, error } = await adminClient
    .from("product_option_group_values")
    .select("id, value")
    .eq("option_group_id", groupId);

  if (error) {
    return { error, conflict: false };
  }

  const normalizedValue = normalizeText(value);

  return {
    error: null,
    conflict: (data ?? []).some((item) => normalizeText(item.value) === normalizedValue),
  };
}

export async function getNextOptionGroupSortOrder(adminClient: AdminClient, productId: string) {
  const { data, error } = await adminClient
    .from("product_option_groups")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { error, sortOrder: 0 };
  }

  return {
    error: null,
    sortOrder: (data?.sort_order ?? -1) + 1,
  };
}

export async function getNextOptionGroupValueSortOrder(adminClient: AdminClient, groupId: string) {
  const { data, error } = await adminClient
    .from("product_option_group_values")
    .select("sort_order")
    .eq("option_group_id", groupId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { error, sortOrder: 0 };
  }

  return {
    error: null,
    sortOrder: (data?.sort_order ?? -1) + 1,
  };
}

export async function removeOptionGroupSelectionsFromVariants(
  adminClient: AdminClient,
  productId: string,
  groupId: string,
) {
  const { data: variants, error: variantsError } = await adminClient
    .from("product_variants")
    .select("id, option_values")
    .eq("product_id", productId);

  if (variantsError) {
    return variantsError;
  }

  const updates = (variants ?? []).flatMap((variant) => {
    if (!Array.isArray(variant.option_values)) {
      return [];
    }

    const nextOptionValues = variant.option_values.filter((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return true;
      }

      const record = entry as Record<string, unknown>;
      return record.groupId !== groupId;
    });

    if (nextOptionValues.length === variant.option_values.length) {
      return [];
    }

    return [{
      id: variant.id,
      optionValues: nextOptionValues as Json,
    }];
  });

  if (updates.length === 0) {
    return null;
  }

  const results = await Promise.all(
    updates.map((update) =>
      adminClient
        .from("product_variants")
        .update({ option_values: update.optionValues })
        .eq("id", update.id),
    ),
  );

  return results.find((result) => result.error)?.error ?? null;
}
