export interface AnalyticsMonthOption {
  value: number;
  label: string;
}

export function buildMonthOptions(): AnalyticsMonthOption[] {
  return Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: new Intl.DateTimeFormat("es-EC", {
      month: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, index, 1))),
  }));
}

export function getCurrentAnalyticsPeriod(referenceDate = new Date()) {
  return {
    currentYear: referenceDate.getFullYear(),
    currentMonth: referenceDate.getMonth() + 1,
  };
}

export function getAvailableMonthOptions(selectedYear: number, referenceDate = new Date()) {
  const { currentYear, currentMonth } = getCurrentAnalyticsPeriod(referenceDate);

  if (selectedYear !== currentYear) {
    return buildMonthOptions();
  }

  return buildMonthOptions().filter((option) => option.value <= currentMonth);
}

export function getValidMonthForYear(selectedMonth: number, selectedYear: number, referenceDate = new Date()) {
  const { currentYear, currentMonth } = getCurrentAnalyticsPeriod(referenceDate);

  if (selectedYear !== currentYear) {
    return selectedMonth;
  }

  return Math.min(selectedMonth, currentMonth);
}

export function buildYearOptions(currentYear: number, totalYears = 5) {
  return Array.from({ length: totalYears }, (_, index) => currentYear - index);
}

export function formatSelectedPeriod(year: number, month: number) {
  return new Intl.DateTimeFormat("es-EC", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}