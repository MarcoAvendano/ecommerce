"use client";

import { useMemo, useState, type ChangeEvent, type MouseEvent } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useTheme } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
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
import { IconPhoto } from "@tabler/icons-react";
import { CatalogClassicTableToolbar } from "@/features/catalog/components/CatalogClassicTableToolbar";
import { Order, getComparator, stableSort } from "@/features/catalog/components/table-utils";
import type { ProductListItem } from "@/features/catalog/catalog.types";

interface ProductsTableProps {
  products: ProductListItem[];
}

type ProductHeadCellId = "name" | "createdAt" | "status" | "slug";

interface ProductHeadCell {
  id: ProductHeadCellId;
  label: string;
  sortable: boolean;
}

const productHeadCells: readonly ProductHeadCell[] = [
  { id: "name", label: "Producto", sortable: true },
  { id: "createdAt", label: "Fecha", sortable: true },
  { id: "status", label: "Estado", sortable: true },
  { id: "slug", label: "Slug", sortable: false },
];

function getStatusColor(status: ProductListItem["status"]) {
  switch (status) {
    case "active":
      return "success";
    case "archived":
      return "default";
    case "draft":
    default:
      return "warning";
  }
}

function getStatusLabel(status: ProductListItem["status"]) {
  switch (status) {
    case "active":
      return "Activo";
    case "archived":
      return "Archivado";
    case "draft":
    default:
      return "Borrador";
  }
}

function getProductSortValue(orderBy: ProductHeadCellId, product: ProductListItem) {
  switch (orderBy) {
    case "createdAt":
      return product.createdAt;
    case "status":
      return getStatusLabel(product.status);
    case "slug":
      return product.slug;
    case "name":
    default:
      return product.name;
  }
}

export function ProductsTable({ products }: ProductsTableProps) {
  const theme = useTheme();
  const borderColor = theme.palette.divider;
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<ProductHeadCellId>("createdAt");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductListItem["status"]>("all");


  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesStatus = statusFilter === "all" ? true : product.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        product.name,
        product.slug,
        product.sku,
        product.slug,
        product.categories.map((category) => category.name).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [products, search, statusFilter]);

  const sortedProducts = useMemo(
    () => stableSort(filteredProducts, getComparator(order, (product) => getProductSortValue(orderBy, product))),
    [filteredProducts, order, orderBy],
  );

  const paginatedProducts = useMemo(
    () => sortedProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [page, rowsPerPage, sortedProducts],
  );

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredProducts.length) : 0;

  const handleRequestSort = (_event: MouseEvent<unknown>, property: ProductHeadCellId) => {
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
        placeholder="Buscar producto"
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        statusFilter={{
          label: "Estado",
          value: statusFilter,
          onChange: (value) => {
            setStatusFilter(value as "all" | ProductListItem["status"]);
            setPage(0);
          },
          options: [
            { value: "all", label: "Todos" },
            { value: "draft", label: "Borrador" },
            { value: "active", label: "Activo" },
            { value: "archived", label: "Archivado" },
          ],
        }}
      />
      <Paper variant="outlined" sx={{ mx: 2, mt: 1, border: `1px solid ${borderColor}` }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tabla-productos-catalogo">
            <TableHead>
              <TableRow>
                {productHeadCells.map((headCell) => (
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
              {paginatedProducts.map((product) => (
                <TableRow hover tabIndex={-1} key={product.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar src={product.imageUrl ?? undefined} alt={product.name} sx={{ width: 56, height: 56 }}>
                        {!product.imageUrl ? <IconPhoto size={18} /> : null}
                      </Avatar>
                      <Box sx={{ ml: 2, minWidth: 0 }}>
                        <Typography
                          component={Link}
                          href={`/apps/products/${product.id}`}
                          variant="h6"
                          fontWeight="600"
                          noWrap
                          sx={{ textDecoration: "none", color: "inherit", "&:hover": { textDecoration: "underline" } }}
                        >
                          {product.name}
                        </Typography>
                        <Typography color="textSecondary" variant="subtitle2" noWrap>
                          SKU {product.sku} · {product.categories[0]?.name ?? "Sin categoria"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography>{format(new Date(product.createdAt), "E, MMM d yyyy")}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          backgroundColor:
                            product.status === "active"
                              ? (currentTheme) => currentTheme.palette.success.main
                              : product.status === "archived"
                                ? (currentTheme) => currentTheme.palette.grey[500]
                                : (currentTheme) => currentTheme.palette.warning.main,
                          borderRadius: "100%",
                          height: "10px",
                          width: "10px",
                        }}
                      />
                      <Typography color="textSecondary" variant="subtitle2" sx={{ ml: 1 }}>
                        {getStatusLabel(product.status)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography>{product.slug}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 ? (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={4} />
                </TableRow>
              ) : null}
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="textSecondary" sx={{ py: 4, textAlign: "center" }}>
                      No hay productos que coincidan con la busqueda actual.
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
          count={filteredProducts.length}
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
