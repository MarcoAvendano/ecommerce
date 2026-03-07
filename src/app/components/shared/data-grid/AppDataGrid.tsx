"use client";

import { useDeferredValue, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowId,
  type GridValidRowModel,
} from "@mui/x-data-grid";

export interface AppDataGridFilterOption {
  value: string;
  label: string;
}

export interface AppDataGridFilterDefinition<Row> {
  key: string;
  label: string;
  allLabel?: string;
  options: AppDataGridFilterOption[];
  getValue: (row: Row) => string | string[] | null | undefined;
}

interface AppDataGridProps<Row extends GridValidRowModel> {
  rows: Row[];
  columns: GridColDef<Row>[];
  getRowId?: (row: Row) => GridRowId;
  filters?: AppDataGridFilterDefinition<Row>[];
  searchPlaceholder?: string;
  searchValueExtractor?: (row: Row) => string;
  emptyMessage?: string;
  loading?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

type ActiveFiltersState = Record<string, string>;

function rowMatchesFilter<Row extends GridValidRowModel>(
  row: Row,
  filter: AppDataGridFilterDefinition<Row>,
  selectedValue: string,
) {
  if (!selectedValue) {
    return true;
  }

  const rowValue = filter.getValue(row);

  if (Array.isArray(rowValue)) {
    return rowValue.includes(selectedValue);
  }

  return rowValue === selectedValue;
}

export function AppDataGrid<Row extends GridValidRowModel>({
  rows,
  columns,
  getRowId,
  filters = [],
  searchPlaceholder = "Buscar...",
  searchValueExtractor,
  emptyMessage = "No hay resultados para mostrar.",
  loading = false,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
}: AppDataGridProps<Row>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFiltersState>({});
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: initialPageSize,
  });
  const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());

  const filteredRows = rows.filter((row) => {
    const matchesSearch = !deferredSearchTerm
      ? true
      : (searchValueExtractor?.(row) ?? JSON.stringify(row))
          .toLowerCase()
          .includes(deferredSearchTerm);

    if (!matchesSearch) {
      return false;
    }

    return filters.every((filter) => rowMatchesFilter(row, filter, activeFilters[filter.key] ?? ""));
  });

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ xs: "stretch", lg: "center" }}>
        <TextField
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setPaginationModel((current) => ({ ...current, page: 0 }));
          }}
          placeholder={searchPlaceholder}
          fullWidth
          size="small"
        />
        {filters.map((filter) => (
          <FormControl key={filter.key} size="small" sx={{ minWidth: 220 }}>
            <InputLabel id={`${filter.key}-filter-label`}>{filter.label}</InputLabel>
            <Select
              labelId={`${filter.key}-filter-label`}
              value={activeFilters[filter.key] ?? ""}
              label={filter.label}
              onChange={(event) => {
                setActiveFilters((current) => ({
                  ...current,
                  [filter.key]: event.target.value,
                }));
                setPaginationModel((current) => ({ ...current, page: 0 }));
              }}
            >
              <MenuItem value="">{filter.allLabel ?? `Todos`}</MenuItem>
              {filter.options.map((option) => (
                <MenuItem key={`${filter.key}-${option.value}`} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </Stack>

      <Box sx={{ width: "100%" }}>
        <DataGrid
          autoHeight
          rows={filteredRows}
          columns={columns}
          getRowId={getRowId}
          loading={loading}
          disableRowSelectionOnClick
          pagination
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={pageSizeOptions}
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              borderRadius: 1.5,
            },
            "& .MuiDataGrid-cell": {
              alignItems: "center",
            },
          }}
          localeText={{
            noRowsLabel: emptyMessage,
            footerRowSelected: (count) => `${count.toLocaleString()} fila(s) seleccionada(s)`,
            MuiTablePagination: {
              labelRowsPerPage: "Filas por pagina",
              labelDisplayedRows: ({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `mas de ${to}`}`,
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", minHeight: 180 }}>
                <Typography variant="body2" color="textSecondary">
                  {emptyMessage}
                </Typography>
              </Stack>
            ),
          }}
        />
      </Box>
    </Stack>
  );
}