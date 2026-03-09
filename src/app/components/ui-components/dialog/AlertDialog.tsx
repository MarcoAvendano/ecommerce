import React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ButtonOwnProps,
  DialogProps,
} from "@mui/material";

interface AlertDialogProps extends DialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
  confirmColor?: ButtonOwnProps["color"];
  cancelColor?: ButtonOwnProps["color"];
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmText,
  cancelText,
  isPending = false,
  confirmColor = "error",
  cancelColor = "inherit",
  ...rest
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      {...rest}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">{children}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending} variant="text" color={cancelColor}>
          {cancelText || "Cancelar"}
        </Button>
        <Button onClick={onConfirm || onClose} autoFocus disabled={isPending} variant="contained" color={confirmColor}>
          {confirmText || "Aceptar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;
