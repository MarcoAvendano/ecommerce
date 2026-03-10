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