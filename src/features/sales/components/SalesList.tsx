"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useSalesQuery } from "../sales.queries";
import { SalesTable } from "./SalesTable";

export function SalesList() {
    const salesQuery = useSalesQuery();

    const isLoading = salesQuery.isLoading;
    const isError = salesQuery.isError;
    const errorMessage = salesQuery.error?.message || null;

    return (
        <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
            >
                <Box>
                    <Typography variant="h6">Ventas</Typography>
                    <Typography variant="body2" color="textSecondary">
                        Listado de ventas realizadas.
                    </Typography>
                </Box>
                <Button component={Link} href="/apps/sales/new" variant="contained">
                    Nueva venta
                </Button>
            </Stack>
            {isLoading ? (
                <Stack alignItems="center" py={6} spacing={2}>
                    <Typography variant="body2" color="textSecondary">
                        Cargando ventas realizadas...
                    </Typography>
                </Stack>
            ) : null}
            {isError ? (
                <Alert
                    severity="error"
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => salesQuery.refetch()}
                        >
                            Reintentar</Button>
                    }
                >{errorMessage}
                </Alert>
            ) : null}
            {salesQuery.isSuccess && salesQuery.data.sales.length === 0  && !isLoading ? (
            <Alert severity="info">No se han registrado ventas aún.</Alert>
        ): null}

            {salesQuery?.isSuccess && salesQuery.data.sales.length > 0 && !isLoading ? (
                <SalesTable sales={salesQuery.data.sales} />
            ): null}

        </Stack>
    );
}