import type { CreatePurchaseOrderInput, UpdatePurchaseOrderInput } from "@/features/suppliers/schemas";

type PurchaseOrderItemLike = CreatePurchaseOrderInput["items"][number] | UpdatePurchaseOrderInput["items"][number];

export interface PurchaseOrderComputedLine {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}

export interface PurchaseOrderTotals {
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  lines: PurchaseOrderComputedLine[];
}

function toFiniteNumber(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function computePurchaseOrderLineTotals(item: PurchaseOrderItemLike): PurchaseOrderComputedLine {
  const orderedQty = Math.max(0, toFiniteNumber(item.orderedQty));
  const unitCostCents = Math.max(0, Math.round(toFiniteNumber(item.unitCostCents)));
  const taxRate = Math.min(100, Math.max(0, toFiniteNumber(item.taxRate)));
  const subtotalCents = Math.round(orderedQty * unitCostCents);
  const taxCents = Math.round(subtotalCents * (taxRate / 100));

  return {
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
  };
}

export function computePurchaseOrderTotals(
  items: PurchaseOrderItemLike[],
  discountCents: number,
): PurchaseOrderTotals {
  const lines = items.map(computePurchaseOrderLineTotals);
  const subtotalCents = lines.reduce((sum, line) => sum + line.subtotalCents, 0);
  const taxCents = lines.reduce((sum, line) => sum + line.taxCents, 0);
  const normalizedDiscountCents = Math.max(0, Math.round(toFiniteNumber(discountCents)));

  return {
    subtotalCents,
    taxCents,
    discountCents: normalizedDiscountCents,
    totalCents: Math.max(0, subtotalCents - normalizedDiscountCents + taxCents),
    lines,
  };
}