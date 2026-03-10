import { ChangeEvent, useMemo, useState, type MouseEvent } from "react";
import Box from "@mui/material/Box";
import { SalesOrderListItem } from "../sales.types";
import { CatalogClassicTableToolbar } from "@/features/catalog/components/CatalogClassicTableToolbar";
import { formatSalesCurrency, formatSalesDate } from "@/features/sales/sales.formatters";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TablePagination from "@mui/material/TablePagination";
import { getComparator, Order, stableSort } from "@/features/catalog/components/table-utils";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";
import { visuallyHidden } from "@mui/utils";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

interface SalesTableProps {
    sales: SalesOrderListItem[];
}

type SalesHeadCellId = "orderNumber" | "status" | "totalCents" | "createdAt";

interface SalesHeadCell {
    id: SalesHeadCellId;
    label: string;
    sortable: boolean;
}

const salesHeadCells: readonly SalesHeadCell[] = [
    { id: "orderNumber", label: "Número de Orden", sortable: true },
    { id: "status", label: "Estado", sortable: true },
    { id: "totalCents", label: "Total", sortable: true },
    { id: "createdAt", label: "Fecha de Creación", sortable: true },
];

function getStatusColor(status: SalesOrderListItem["status"]) {
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

function getStatusLabel(status: SalesOrderListItem["status"]) {
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

function getSalesSortValue(orderBy: SalesHeadCellId, sale: SalesOrderListItem) {
    switch (orderBy) {
        case "createdAt":
            return sale.createdAt;
        case "status":
            return getStatusLabel(sale.status);
        case "totalCents":
            return sale.totalCents;
        case "orderNumber":
        default:
            return sale.orderNumber;
    }
}


export function SalesTable({ sales }: SalesTableProps) {
    const theme = useTheme();
    const borderColor = theme.palette.divider;
    const [order, setOrder] = useState<Order>("asc");
    const [orderBy, setOrderBy] = useState<SalesHeadCellId>("createdAt");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | SalesOrderListItem["status"]>("all");

    const filteredSales = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return sales.filter(sale => {
            const matchesSearch = sale.orderNumber.toLowerCase().includes(normalizedSearch);
            const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [sales, search, statusFilter]);

    const sortedSales = useMemo(
        () => stableSort(filteredSales, getComparator(order, (sale) => getSalesSortValue(orderBy, sale))),
        [filteredSales, order, orderBy],
    );

    const paginatedSales = useMemo(
        () => sortedSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [page, rowsPerPage, sortedSales],
    );

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredSales.length) : 0;

    const handleRequestSort = (_event: MouseEvent<unknown>, property: SalesHeadCellId) => {
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
                placeholder="Buscar Venta"
                onSearchChange={(value) => {
                    setSearch(value);
                    setPage(0);
                }}
                statusFilter={{
                    label: "Estado",
                    value: statusFilter,
                    onChange: (value) => {
                        setStatusFilter(value as "all" | SalesOrderListItem["status"]);
                        setPage(0);
                    },
                    options: [
                        { value: "all", label: "Todos" },
                        { value: "pending", label: "Pendiente" },
                        { value: "completed", label: "Completada" },
                        { value: "cancelled", label: "Cancelada" },
                        { value: "draft", label: "Borrador" }
                    ],
                }}
            />
            <Paper variant="outlined" sx={{ mx: 2, mt: 1, border: `1px solid ${borderColor}` }}>
                <TableContainer>
                    <Table sx={{ minWidth: 750 }} aria-labelledby="tabla-ventas" >
                        <TableHead>
                            <TableRow>
                                {salesHeadCells.map((headCell) => (
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
                            {paginatedSales.map((sales) => (
                                <TableRow hover tabIndex={-1} key={sales.id}>
                                    <TableCell>{sales.orderNumber}</TableCell>
                                    <TableCell>
                                       <Chip label={getStatusLabel(sales.status)} color={getStatusColor(sales.status)} size="small" />
                                    </TableCell>
                                    <TableCell>{formatSalesCurrency(sales.totalCents)}</TableCell>
                                    <TableCell>{formatSalesDate(sales.createdAt)}</TableCell>
                                </TableRow>
                            ))}
                            {emptyRows > 0 ? (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                    <TableCell colSpan={4} />
                                </TableRow>
                            ) : null}
                            {filteredSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <Typography variant="body2" color="textSecondary" sx={{ py: 4, textAlign: "center" }}>
                                            No hay ventas que coincidan con la busqueda actual.
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
                    count={filteredSales.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por pagina"
                />
            </Paper>
        </Box >
    )

}