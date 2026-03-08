import { Drawer, DrawerProps } from "@mui/material";

export function ResponsiveDrawer(props: DrawerProps) {
    const isMobile = window.innerWidth < 600; // Simple check for mobile devices
    return (
        <Drawer
            {...props}
            anchor={isMobile ? "bottom" : "right"}
        />
    );
}