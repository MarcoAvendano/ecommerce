"use client";

import { alpha } from "@mui/material/styles";
import {
  Box,
  FormControl,
  InputLabel,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Toolbar,
} from "@mui/material";
import { IconSearch } from "@tabler/icons-react";

interface ToolbarFilterOption {
  value: string;
  label: string;
}

interface ToolbarStatusFilter {
  label: string;
  value: string;
  options: ToolbarFilterOption[];
  onChange: (value: string) => void;
}

interface CatalogClassicTableToolbarProps {
  search: string;
  placeholder: string;
  onSearchChange: (value: string) => void;
  statusFilter?: ToolbarStatusFilter;
}

export function CatalogClassicTableToolbar({
  search,
  placeholder,
  onSearchChange,
  statusFilter,
}: CatalogClassicTableToolbarProps) {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        gap: 2,
        flexWrap: "wrap",
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.98),
      }}
    >
      <Box sx={{ flex: "1 1 320px" }}>
        <TextField
          value={search}
          placeholder={placeholder}
          size="small"
          fullWidth
          onChange={(event) => onSearchChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={18} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      {statusFilter ? (
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id={`${statusFilter.label}-filter-label`}>{statusFilter.label}</InputLabel>
          <Select
            labelId={`${statusFilter.label}-filter-label`}
            value={statusFilter.value}
            label={statusFilter.label}
            onChange={(event) => statusFilter.onChange(event.target.value)}
          >
            {statusFilter.options.map((option) => (
              <MenuItem key={`${statusFilter.label}-${option.value}`} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}
    </Toolbar>
  );
}