import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { requireAuth } from "@/lib/auth";
import SettingsTabs from "@/features/settings/components/SettingsTabs";

export const metadata = {
  title: "Configuración",
};

export default async function SettingsPage() {
  const authContext = await requireAuth();

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" fontWeight={600}>
          Configuración
        </Typography>
        <Typography variant="body1" color="textSecondary" mt={1}>
          Administra tu perfil, el negocio y las preferencias del sistema.
        </Typography>
      </Box>
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <SettingsTabs isAdmin={authContext.isAdmin} />
        </CardContent>
      </Card>
    </Container>
  );
}
