export function formatPrice(priceInCents: number): string {
  const priceInDollars = priceInCents / 100;
  return priceInDollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}