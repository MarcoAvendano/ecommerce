"use client";

import Link from "next/link";
import Image from "next/image";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { useCustomizerStore } from "@/stores/use-customizer-store";
import { useBusinessQuery } from "@/features/settings/settings.queries";

const Logo = () => {
  const customizer = useCustomizerStore();
  const isCollapsed = customizer.isCollapse && !customizer.isSidebarHover;

  const businessQuery = useBusinessQuery();
  const business = businessQuery.data?.business;
  const logoUrl = business?.logo_url ?? null;
  const businessName = business?.name ?? null;

  const LinkStyled = styled(Link)(() => ({
    height: customizer.TopbarHeight,
    width: isCollapsed ? "40px" : "180px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
  }));

  // ── Custom business logo from DB ──────────────────────────────────────────
  if (logoUrl) {
    return (
      <LinkStyled href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={businessName ?? "logo"}
          style={{
            height: "36px",
            width: "36px",
            objectFit: "contain",
            flexShrink: 0,
          }}
        />
        {!isCollapsed && businessName ? (
          <Typography
            variant="h6"
            fontWeight={700}
            noWrap
            sx={{ ml: 1, lineHeight: 1.2 }}
          >
            {businessName}
          </Typography>
        ) : null}
      </LinkStyled>
    );
  }

  // ── Default SVG logos ─────────────────────────────────────────────────────
  const LinkStyledSvg = styled(Link)(() => ({
    height: customizer.TopbarHeight,
    width: isCollapsed ? "40px" : "180px",
    overflow: "hidden",
    display: "block",
  }));

  if (customizer.activeDir === "ltr") {
    return (
      <LinkStyledSvg href="/">
        {customizer.activeMode === "dark" ? (
          <Image
            src="/images/logos/light-logo.svg"
            alt="logo"
            height={customizer.TopbarHeight}
            width={174}
            priority
          />
        ) : (
          <Image
            src="/images/logos/dark-logo.svg"
            alt="logo"
            height={customizer.TopbarHeight}
            width={174}
            priority
          />
        )}
      </LinkStyledSvg>
    );
  }

  return (
    <LinkStyledSvg href="/">
      {customizer.activeMode === "dark" ? (
        <Image
          src="/images/logos/dark-rtl-logo.svg"
          alt="logo"
          height={customizer.TopbarHeight}
          width={174}
          priority
        />
      ) : (
        <Image
          src="/images/logos/light-logo-rtl.svg"
          alt="logo"
          height={customizer.TopbarHeight}
          width={174}
          priority
        />
      )}
    </LinkStyledSvg>
  );
};

export default Logo;
