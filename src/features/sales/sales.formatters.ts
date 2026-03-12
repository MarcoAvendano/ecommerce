type SalesStatusColor = "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning";

import type { SalesStatus } from "@/features/sales/sales.types";

const salesCurrencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

const salesDateFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatSalesCurrency(cents: number) {
  return salesCurrencyFormatter.format(cents / 100);
}

export function formatSalesDate(value: string) {
  return salesDateFormatter.format(new Date(value));
}

export function formatSalesStatusLabel(status: SalesStatus) {
  switch (status) {
    case "paid":
      return "Pagada";
    case "pending":
      return "Pendiente";
    case "draft":
      return "Borrador";
    case "cancelled":
      return "Cancelada";
    case "fulfilled":
      return "Completada";
    case "refunded":
      return "Reembolsada";
    default:
      return "Borrador";
  }
}

export function formatSalesStatusColor(status: SalesStatus): SalesStatusColor {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "draft":
      return "default";
    case "cancelled":
      return "error";
    case "fulfilled":
      return "primary";
    case "refunded":
      return "info";
    default:
      return "warning";
  }
}

export function formatSalesPaymentMethod(paymentMethod: string | null) {
  switch (paymentMethod) {
    case "cash":
      return "Efectivo";
    case "card":
      return "Tarjeta";
    case "transfer":
      return "Transferencia";
    case "mixed":
      return "Mixto";
    default:
      return "No registrado";
  }
}

export function formatSalesChannel(salesChannel: string) {
  switch (salesChannel) {
    case "pos":
      return "Punto de venta";
    default:
      return salesChannel;
  }
}