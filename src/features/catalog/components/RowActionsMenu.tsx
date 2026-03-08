"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import {
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconDotsVertical } from "@tabler/icons-react";

export interface RowActionItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface RowActionsMenuProps {
  tooltip: string;
  actions: RowActionItem[];
}

export function RowActionsMenu({ tooltip, actions }: RowActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action: RowActionItem) => {
    action.onClick();
    handleClose();
  };

  return (
    <>
      <Tooltip title={tooltip}>
        <IconButton size="small" onClick={handleOpen}>
          <IconDotsVertical size="1.1rem" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {actions.map((action) => (
          <MenuItem key={action.id} onClick={() => handleActionClick(action)}>
            <ListItemIcon>{action.icon}</ListItemIcon>
            <Typography variant="inherit">{action.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}