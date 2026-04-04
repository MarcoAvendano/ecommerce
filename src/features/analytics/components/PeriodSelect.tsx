"use client";

import { MenuItem, Stack, type SelectChangeEvent } from "@mui/material";
import CustomSelect from "@/app/components/forms/theme-elements/CustomSelect";
import type { DashboardSalesGranularity } from "@/features/analytics/analytics.types";

export interface PeriodSelectProps {
  month: number;
  year: number;
  monthOptions: Array<{ value: number; label: string }>;
  yearOptions: number[];
  idPrefix?: string;
  granularity?: DashboardSalesGranularity;
  granularityOptions?: Array<{ value: DashboardSalesGranularity; label: string }>;
  onMonthChange: (event: SelectChangeEvent<unknown>) => void;
  onYearChange: (event: SelectChangeEvent<unknown>) => void;
  onGranularityChange?: (event: SelectChangeEvent<unknown>) => void;
}

export function PeriodSelect({
  month,
  year,
  monthOptions,
  yearOptions,
  idPrefix = "dashboard-analytics",
  granularity,
  granularityOptions,
  onMonthChange,
  onYearChange,
  onGranularityChange,
}: PeriodSelectProps) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      <CustomSelect
        labelId={`${idPrefix}-month`}
        id={`${idPrefix}-month`}
        size="small"
        value={month}
        onChange={onMonthChange}
        sx={{ minWidth: 150, backgroundColor: "background.paper" }}
      >
        {monthOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </CustomSelect>
      <CustomSelect
        labelId={`${idPrefix}-year`}
        id={`${idPrefix}-year`}
        size="small"
        value={year}
        onChange={onYearChange}
        sx={{ minWidth: 100, backgroundColor: "background.paper" }}
      >
        {yearOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </CustomSelect>
      {granularity && granularityOptions && onGranularityChange ? (
        <CustomSelect
          labelId={`${idPrefix}-granularity`}
          id={`${idPrefix}-granularity`}
          size="small"
          value={granularity}
          onChange={onGranularityChange}
          sx={{ minWidth: 120, backgroundColor: "background.paper" }}
        >
          {granularityOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </CustomSelect>
      ) : null}
    </Stack>
  );
}