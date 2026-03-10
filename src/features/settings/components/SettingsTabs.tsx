"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import dynamic from "next/dynamic";
import ProfileTab from "@/features/settings/components/ProfileTab";
import BusinessTab from "@/features/settings/components/BusinessTab";

// Lazy-load SystemTab to avoid loading the customizer store on every tab
const SystemTab = dynamic(
  () => import("@/features/settings/components/SystemTab"),
  { ssr: false },
);

interface SettingsTabsProps {
  isAdmin: boolean;
}

export default function SettingsTabs({ isAdmin }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, value: number) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab label="Perfil" id="settings-tab-0" aria-controls="settings-tabpanel-0" />
        <Tab label="Negocio" id="settings-tab-1" aria-controls="settings-tabpanel-1" />
        <Tab label="Sistema" id="settings-tab-2" aria-controls="settings-tabpanel-2" />
      </Tabs>

      <Box
        role="tabpanel"
        id="settings-tabpanel-0"
        aria-labelledby="settings-tab-0"
        hidden={activeTab !== 0}
      >
        {activeTab === 0 && <ProfileTab />}
      </Box>

      <Box
        role="tabpanel"
        id="settings-tabpanel-1"
        aria-labelledby="settings-tab-1"
        hidden={activeTab !== 1}
      >
        {activeTab === 1 && <BusinessTab isAdmin={isAdmin} />}
      </Box>

      <Box
        role="tabpanel"
        id="settings-tabpanel-2"
        aria-labelledby="settings-tab-2"
        hidden={activeTab !== 2}
      >
        {activeTab === 2 && <SystemTab />}
      </Box>
    </Box>
  );
}
