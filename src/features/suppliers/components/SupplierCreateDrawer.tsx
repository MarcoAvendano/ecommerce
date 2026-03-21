"use client";

import { Box, DialogContent, DialogTitle } from "@mui/material";
import { ResponsiveDrawer } from "@/app/components/ui-components/drawer/ResponsiveDrawer";
import { SupplierForm } from "@/features/suppliers/components/SupplierForm";

interface SupplierCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  onCompleted: (message: string) => void;
}

export function SupplierCreateDrawer({ open, onClose, onCompleted }: SupplierCreateDrawerProps) {
  return (
    <ResponsiveDrawer open={open} onClose={onClose} sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 540 } } }}>
      <DialogTitle>Nuevo proveedor</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          <SupplierForm
            onCancel={onClose}
            onCompleted={(message) => {
              onCompleted(message);
              onClose();
            }}
          />
        </Box>
      </DialogContent>
    </ResponsiveDrawer>
  );
}
