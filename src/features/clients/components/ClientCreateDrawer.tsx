"use client";

import {
  Box,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { ResponsiveDrawer } from "@/app/components/ui-components/drawer/ResponsiveDrawer";
import { ClientForm } from "@/features/clients/components/ClientForm";
import type { ClientListItem } from "@/features/clients/clients.types";

interface ClientCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  onCompleted: (message: string) => void;
  mode?: "create" | "edit";
  client?: ClientListItem | null;
}

export function ClientCreateDrawer({
  open,
  onClose,
  onCompleted,
  mode = "create",
  client = null,
}: ClientCreateDrawerProps) {
  return (
    <ResponsiveDrawer
      open={open}
      onClose={onClose}
      sx={{
        width: "100%",
        maxWidth: 520,
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 520 },
          maxWidth: "100%",
        },
      }}
    >
      <DialogTitle>{mode === "edit" ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
      <Box>
        <DialogContent dividers>
          <ClientForm
            mode={mode}
            client={client}
            onCompleted={(message) => {
              onCompleted(message);
              onClose();
            }}
            onCancel={onClose}
          />
        </DialogContent>
      </Box>
    </ResponsiveDrawer>
  );
}
