import React from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

interface ResponsiveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children?: React.ReactNode;
  isPending?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmButtonType?: "reset" | "button" | "submit";
}

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  children,
  isPending = false,
  confirmText = "Agree",
  cancelText = "Disagree",
  confirmButtonType = "button",
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog fullScreen={fullScreen} open={open} onClose={onClose} aria-labelledby="responsive-dialog-title">
      <DialogTitle id="responsive-dialog-title">{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose} disabled={isPending} variant="text">
          {cancelText}
        </Button>
        <Button
          type={confirmButtonType}
          onClick={onConfirm || onClose}
          autoFocus
          disabled={isPending}
          variant="contained"
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResponsiveDialog;
