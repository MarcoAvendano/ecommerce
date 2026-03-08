"use client";

import { useMemo, useState, type ChangeEvent, type MouseEvent } from "react";
import { format } from "date-fns";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { IconEdit } from "@tabler/icons-react";
import { CatalogClassicTableToolbar } from "@/features/catalog/components/CatalogClassicTableToolbar";
import { RowActionsMenu } from "@/features/catalog/components/RowActionsMenu";
import { Order, getComparator, stableSort } from "@/features/catalog/components/table-utils";
import type { CategoryListItem } from "@/features/catalog/catalog.types";

interface CategoriesTableProps {
  categories: CategoryListItem[];
  onEdit: (category: CategoryListItem) => void;
}

type CategoryHeadCellId = "name" | "parentName" | "sortOrder" | "isActive" | "createdAt" | "actions";

interface CategoryHeadCell {
  id: CategoryHeadCellId;
  label: string;
  sortable: boolean;
}

const categoryHeadCells: readonly CategoryHeadCell[] = [
  { id: "name", label: "Categoria", sortable: true },
  { id: "parentName", label: "Padre", sortable: true },
  { id: "sortOrder", label: "Orden", sortable: true },
  { id: "isActive", label: "Estado", sortable: true },
  { id: "createdAt", label: "Creada", sortable: true },
  { id: "actions", label: "Acciones", sortable: false },
];

function getCategorySortValue(orderBy: CategoryHeadCellId, category: CategoryListItem) {
  switch (orderBy) {
    case "parentName":
      return category.parentName ?? "Raiz";
    case "sortOrder":
      return category.sortOrder;
    case "isActive":
      return category.isActive;
    case "createdAt":
      return category.createdAt;
    case "name":
    default:
      return category.name;
  }
}

export function CategoriesTable({ categories, onEdit }: CategoriesTableProps) {
  const theme = useTheme();
  const borderColor = theme.palette.divider;
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<CategoryHeadCellId>("name");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? category.isActive
            : !category.isActive;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        category.name,
        category.slug,
        category.parentName ?? "",
        category.isActive ? "activa" : "inactiva",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [categories, search, statusFilter]);

  const sortedCategories = useMemo(
    () => stableSort(filteredCategories, getComparator(order, (category) => getCategorySortValue(orderBy, category))),
    [filteredCategories, order, orderBy],
  );

  const paginatedCategories = useMemo(
    () => sortedCategories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [page, rowsPerPage, sortedCategories],
  );

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredCategories.length) : 0;

  const handleRequestSort = (_event: MouseEvent<unknown>, property: CategoryHeadCellId) => {
    if (property === "actions") {
      return;
    }

    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <CatalogClassicTableToolbar
        search={search}
        placeholder="Buscar categoria"
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        statusFilter={{
          label: "Estado",
          value: statusFilter,
          onChange: (value) => {
            setStatusFilter(value as "all" | "active" | "inactive");
            setPage(0);
          },
          options: [
            { value: "all", label: "Todas" },
            { value: "active", label: "Activas" },
            { value: "inactive", label: "Inactivas" },
          ],
        }}
      />
      <Paper variant="outlined" sx={{ mx: 2, mt: 1, border: `1px solid ${borderColor}` }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tabla-categorias-catalogo">
            <TableHead>
              <TableRow>
                {categoryHeadCells.map((headCell) => (
                  <TableCell key={headCell.id} sortDirection={orderBy === headCell.id ? order : false}>
                    {headCell.sortable ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : "asc"}
                        onClick={(event) => handleRequestSort(event, headCell.id)}
                      >
                        {headCell.label}
                        {orderBy === headCell.id ? (
                          <Box component="span" sx={visuallyHidden}>
                            {order === "desc" ? "sorted descending" : "sorted ascending"}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCategories.map((category) => (
                <TableRow hover tabIndex={-1} key={category.id}>
                  <TableCell>
                    <Box sx={{ py: 0.75, minWidth: 0 }}>
                      <Typography variant="h6" fontWeight="600" noWrap>
                        {category.name}
                      </Typography>
                      <Typography color="textSecondary" variant="subtitle2" noWrap>
                        /{category.slug}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography color="textSecondary" variant="subtitle2">
                      {category.parentName ?? "Raiz"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600} variant="subtitle1">
                      {category.sortOrder}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={category.isActive ? "Activa" : "Inactiva"}
                      color={category.isActive ? "success" : "default"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography>{format(new Date(category.createdAt), "E, MMM d yyyy")}</Typography>
                  </TableCell>
                  <TableCell>
                    <RowActionsMenu
                      tooltip="Acciones de la categoria"
                      actions={[
                        {
                          id: "edit-category",
                          label: "Editar categoria",
                          icon: <IconEdit size={18} />,
                          onClick: () => onEdit(category),
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 ? (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              ) : null}
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="textSecondary" sx={{ py: 4, textAlign: "center" }}>
                      No hay categorias que coincidan con la busqueda actual.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCategories.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por pagina"
        />
      </Paper>
    </Box>
  );
}