import type { InventoryMovementType, PurchaseOrderStatus } from "@/features/suppliers/suppliers.types";

type StatusColor = "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning";

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatSupplierCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

export function formatSupplierDate(value: string | null) {
  if (!value) {
    return "No definida";
  }

  return dateFormatter.format(new Date(value));
}

export function formatPurchaseOrderStatusLabel(status: PurchaseOrderStatus) {
  switch (status) {
    case "draft":
      return "Borrador";
    case "sent":
      return "Enviada";
    case "partial":
      return "Recepcion parcial";
    case "received":
      return "Recibida";
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
}

export function formatPurchaseOrderStatusColor(status: PurchaseOrderStatus): StatusColor {
  switch (status) {
    case "draft":
      return "default";
    case "sent":
      return "info";
    case "partial":
      return "warning";
    case "received":
      return "success";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
}

export function formatMovementTypeLabel(movementType: InventoryMovementType) {
  switch (movementType) {
    case "purchase_receipt":
      return "Ingreso por compra";
    case "initial_load":
      return "Carga inicial";
    case "sale":
      return "Venta";
    case "sale_return":
      return "Devolucion de venta";
    case "adjustment_in":
      return "Ajuste positivo";
    case "adjustment_out":
      return "Ajuste negativo";
    case "transfer_in":
      return "Transferencia entrada";
    case "transfer_out":
      return "Transferencia salida";
    default:
      return movementType;
  }
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat("es-EC", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
}
