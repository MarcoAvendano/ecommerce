export type Order = "asc" | "desc";

function normalizeSortValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (value == null) {
    return "";
  }

  return String(value).toLowerCase();
}

function descendingComparator<T>(a: T, b: T, getSortValue: (row: T) => unknown) {
  const firstValue = normalizeSortValue(getSortValue(a));
  const secondValue = normalizeSortValue(getSortValue(b));

  if (secondValue < firstValue) {
    return -1;
  }

  if (secondValue > firstValue) {
    return 1;
  }

  return 0;
}

export function getComparator<T>(order: Order, getSortValue: (row: T) => unknown) {
  return order === "desc"
    ? (a: T, b: T) => descendingComparator(a, b, getSortValue)
    : (a: T, b: T) => -descendingComparator(a, b, getSortValue);
}

export function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedItems = array.map((item, index) => [item, index] as const);

  stabilizedItems.sort((firstItem, secondItem) => {
    const order = comparator(firstItem[0], secondItem[0]);

    if (order !== 0) {
      return order;
    }

    return firstItem[1] - secondItem[1];
  });

  return stabilizedItems.map(([item]) => item);
}