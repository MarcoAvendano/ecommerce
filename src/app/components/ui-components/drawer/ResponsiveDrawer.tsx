"use client";

import { Drawer, useMediaQuery, type DrawerProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export function ResponsiveDrawer(props: DrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return <Drawer {...props} anchor={isMobile ? "bottom" : "right"} />;
}
