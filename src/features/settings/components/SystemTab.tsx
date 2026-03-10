"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { StockLocationsSection } from "@/features/settings/components/StockLocationsSection";
import { PaymentMethodsSection } from "@/features/settings/components/PaymentMethodsSection";
import ThemeSection from "@/features/settings/components/ThemeSection";

export default function SystemTab() {
  return (
    <Box>
      {/* Stock locations */}
      <StockLocationsSection />

      <Divider sx={{ my: 4 }} />

      {/* Payment methods */}
      <PaymentMethodsSection />

      <Divider sx={{ my: 4 }} />

      {/* Theme */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Apariencia
        </Typography>
        <Typography variant="body2" color="textSecondary" mb={3}>
          Personaliza los colores, el modo y el layout de la interfaz.
        </Typography>
        <ThemeSection />
      </Box>
    </Box>
  );
}
