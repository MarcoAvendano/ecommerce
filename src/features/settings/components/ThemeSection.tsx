"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import type { BoxProps } from "@mui/material/Box";
import { IconCheck } from "@tabler/icons-react";
import WbSunnyTwoToneIcon from "@mui/icons-material/WbSunnyTwoTone";
import DarkModeTwoToneIcon from "@mui/icons-material/DarkModeTwoTone";
import SwipeLeftAltTwoToneIcon from "@mui/icons-material/SwipeLeftAltTwoTone";
import SwipeRightAltTwoToneIcon from "@mui/icons-material/SwipeRightAltTwoTone";
import AspectRatioTwoToneIcon from "@mui/icons-material/AspectRatioTwoTone";
import CallToActionTwoToneIcon from "@mui/icons-material/CallToActionTwoTone";
import ViewSidebarTwoToneIcon from "@mui/icons-material/ViewSidebarTwoTone";
import WebAssetTwoToneIcon from "@mui/icons-material/WebAssetTwoTone";
import { ViewComfyTwoTone, PaddingTwoTone, BorderOuter } from "@mui/icons-material";
import { useCustomizerStore } from "@/stores/use-customizer-store";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  boxShadow: theme.shadows[4],
  padding: "16px 20px",
  cursor: "pointer",
  justifyContent: "center",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "0.1s ease-in",
  border: "1px solid rgba(145, 158, 171, 0.12)",
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    transform: "scale(1.03)",
  },
}));

const thColors = [
  { id: 1, bgColor: "#5D87FF", disp: "BLUE_THEME", label: "Azul" },
  { id: 2, bgColor: "#0074BA", disp: "AQUA_THEME", label: "Agua" },
  { id: 3, bgColor: "#763EBD", disp: "PURPLE_THEME", label: "Morado" },
  { id: 4, bgColor: "#0A7EA4", disp: "GREEN_THEME", label: "Verde" },
  { id: 5, bgColor: "#01C0C8", disp: "CYAN_THEME", label: "Cian" },
  { id: 6, bgColor: "#FA896B", disp: "ORANGE_THEME", label: "Naranja" },
];

export default function ThemeSection() {
  const customizer = useCustomizerStore();
  const setTheme = useCustomizerStore((s) => s.setTheme);
  const setDir = useCustomizerStore((s) => s.setDir);
  const setDarkMode = useCustomizerStore((s) => s.setDarkMode);
  const toggleLayout = useCustomizerStore((s) => s.toggleLayout);
  const toggleSidebar = useCustomizerStore((s) => s.toggleSidebar);
  const toggleHorizontal = useCustomizerStore((s) => s.toggleHorizontal);
  const setBorderRadius = useCustomizerStore((s) => s.setBorderRadius);
  const setCardShadow = useCustomizerStore((s) => s.setCardShadow);

  return (
    <Box>
      {/* Modo oscuro/claro */}
      <Typography variant="h6" gutterBottom>
        Modo de tema
      </Typography>
      <Stack direction="row" gap={2} mb={4}>
        <StyledBox onClick={() => setDarkMode("light")} flex={1}>
          <WbSunnyTwoToneIcon
            color={customizer.activeMode === "light" ? "primary" : "inherit"}
          />
          <Typography variant="body2">Claro</Typography>
        </StyledBox>
        <StyledBox onClick={() => setDarkMode("dark")} flex={1}>
          <DarkModeTwoToneIcon
            color={customizer.activeMode === "dark" ? "primary" : "inherit"}
          />
          <Typography variant="body2">Oscuro</Typography>
        </StyledBox>
      </Stack>

      {/* Dirección */}
      <Typography variant="h6" gutterBottom>
        Dirección
      </Typography>
      <Stack direction="row" gap={2} mb={4}>
        <StyledBox onClick={() => setDir("ltr")} flex={1}>
          <SwipeLeftAltTwoToneIcon
            color={customizer.activeDir === "ltr" ? "primary" : "inherit"}
          />
          <Typography variant="body2">LTR</Typography>
        </StyledBox>
        <StyledBox onClick={() => setDir("rtl")} flex={1}>
          <SwipeRightAltTwoToneIcon
            color={customizer.activeDir === "rtl" ? "primary" : "inherit"}
          />
          <Typography variant="body2">RTL</Typography>
        </StyledBox>
      </Stack>

      {/* Colores */}
      <Typography variant="h6" gutterBottom>
        Color del tema
      </Typography>
      <Grid container spacing={2} mb={4}>
        {thColors.map((thcolor) => (
          <Grid item xs={4} key={thcolor.id}>
            <StyledBox onClick={() => setTheme(thcolor.disp)}>
              <Box
                sx={{
                  backgroundColor: thcolor.bgColor,
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {customizer.activeTheme === thcolor.disp ? (
                  <IconCheck width={13} />
                ) : null}
              </Box>
              <Typography variant="caption">{thcolor.label}</Typography>
            </StyledBox>
          </Grid>
        ))}
      </Grid>

      {/* Tipo de layout */}
      <Typography variant="h6" gutterBottom>
        Tipo de layout
      </Typography>
      <Stack direction="row" gap={2} mb={4}>
        <StyledBox onClick={() => toggleHorizontal(false)} flex={1}>
          <ViewComfyTwoTone
            color={customizer.isHorizontal === false ? "primary" : "inherit"}
          />
          <Typography variant="body2">Vertical</Typography>
        </StyledBox>
        <StyledBox onClick={() => toggleHorizontal(true)} flex={1}>
          <PaddingTwoTone
            color={customizer.isHorizontal === true ? "primary" : "inherit"}
          />
          <Typography variant="body2">Horizontal</Typography>
        </StyledBox>
      </Stack>

      {/* Contenedor */}
      <Typography variant="h6" gutterBottom>
        Contenedor
      </Typography>
      <Stack direction="row" gap={2} mb={4}>
        <StyledBox onClick={() => toggleLayout("boxed")} flex={1}>
          <CallToActionTwoToneIcon
            color={customizer.isLayout === "boxed" ? "primary" : "inherit"}
          />
          <Typography variant="body2">Encuadrado</Typography>
        </StyledBox>
        <StyledBox onClick={() => toggleLayout("full")} flex={1}>
          <AspectRatioTwoToneIcon
            color={customizer.isLayout === "full" ? "primary" : "inherit"}
          />
          <Typography variant="body2">Completo</Typography>
        </StyledBox>
      </Stack>

      {/* Tipo de sidebar */}
      {!customizer.isHorizontal && (
        <>
          <Typography variant="h6" gutterBottom>
            Tipo de barra lateral
          </Typography>
          <Stack direction="row" gap={2} mb={4}>
            <StyledBox onClick={toggleSidebar} flex={1}>
              <WebAssetTwoToneIcon
                color={!customizer.isCollapse ? "primary" : "inherit"}
              />
              <Typography variant="body2">Completa</Typography>
            </StyledBox>
            <StyledBox onClick={toggleSidebar} flex={1}>
              <ViewSidebarTwoToneIcon
                color={customizer.isCollapse ? "primary" : "inherit"}
              />
              <Typography variant="body2">Mini</Typography>
            </StyledBox>
          </Stack>
        </>
      )}

      {/* Tarjetas */}
      <Typography variant="h6" gutterBottom>
        Estilo de tarjetas
      </Typography>
      <Stack direction="row" gap={2} mb={4}>
        <StyledBox onClick={() => setCardShadow(false)} flex={1}>
          <BorderOuter color={!customizer.isCardShadow ? "primary" : "inherit"} />
          <Typography variant="body2">Borde</Typography>
        </StyledBox>
        <StyledBox onClick={() => setCardShadow(true)} flex={1}>
          <CallToActionTwoToneIcon
            color={customizer.isCardShadow ? "primary" : "inherit"}
          />
          <Typography variant="body2">Sombra</Typography>
        </StyledBox>
      </Stack>

      {/* Border radius */}
      <Typography variant="h6" gutterBottom>
        Radio de bordes
      </Typography>
      <Box px={1}>
        <Slider
          size="small"
          value={customizer.borderRadius}
          min={4}
          max={24}
          onChange={(_, value) => setBorderRadius(value as number)}
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
}
