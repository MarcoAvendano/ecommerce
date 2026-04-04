"use client";

import React from "react";
import type { SelectChangeEvent } from "@mui/material";
import {
  buildYearOptions,
  getAvailableMonthOptions,
  getCurrentAnalyticsPeriod,
  getValidMonthForYear,
} from "@/features/analytics/analytics.filters";

interface UseDashboardPeriodOptions {
  totalYears?: number;
  initialMonth?: number;
  initialYear?: number;
  referenceDate?: Date;
}

export function useDashboardPeriod(options?: UseDashboardPeriodOptions) {
  const referenceDate = React.useRef(options?.referenceDate ?? new Date());
  const { currentYear, currentMonth } = React.useMemo(
    () => getCurrentAnalyticsPeriod(referenceDate.current),
    [],
  );

  const [year, setYear] = React.useState(options?.initialYear ?? currentYear);
  const [month, setMonth] = React.useState(() =>
    getValidMonthForYear(options?.initialMonth ?? currentMonth, options?.initialYear ?? currentYear, referenceDate.current),
  );

  const monthOptions = React.useMemo(
    () => getAvailableMonthOptions(year, referenceDate.current),
    [year],
  );

  const yearOptions = React.useMemo(
    () => buildYearOptions(currentYear, options?.totalYears),
    [currentYear, options?.totalYears],
  );

  React.useEffect(() => {
    setMonth((previousMonth) => getValidMonthForYear(previousMonth, year, referenceDate.current));
  }, [year]);

  const handleMonthChange = React.useCallback((event: SelectChangeEvent<unknown>) => {
    setMonth(Number(event.target.value));
  }, []);

  const handleYearChange = React.useCallback((event: SelectChangeEvent<unknown>) => {
    setYear(Number(event.target.value));
  }, []);

  return {
    currentMonth,
    currentYear,
    month,
    year,
    monthOptions,
    yearOptions,
    setMonth,
    setYear,
    handleMonthChange,
    handleYearChange,
  };
}