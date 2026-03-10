"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export type ThemeMode = "light" | "dark";
export type ThemeDirection = "ltr" | "rtl";
export type ThemeLayout = "full" | "boxed";

export interface CustomizerState {
  activeDir: ThemeDirection;
  activeMode: ThemeMode;
  activeTheme: string;
  SidebarWidth: number;
  MiniSidebarWidth: number;
  TopbarHeight: number;
  isCollapse: boolean;
  isLayout: ThemeLayout;
  isSidebarHover: boolean;
  isMobileSidebar: boolean;
  isHorizontal: boolean;
  isLanguage: string;
  isCardShadow: boolean;
  borderRadius: number;
  setTheme: (theme: string) => void;
  setDarkMode: (mode: ThemeMode) => void;
  setDir: (direction: ThemeDirection) => void;
  setLanguage: (language: string) => void;
  setCardShadow: (enabled: boolean) => void;
  toggleSidebar: () => void;
  hoverSidebar: (isHovering: boolean) => void;
  toggleMobileSidebar: () => void;
  toggleLayout: (layout: ThemeLayout) => void;
  toggleHorizontal: (isHorizontal: boolean) => void;
  setBorderRadius: (radius: number) => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const initialState = {
  activeDir: "ltr" as ThemeDirection,
  activeMode: "light" as ThemeMode,
  activeTheme: "BLUE_THEME",
  SidebarWidth: 270,
  MiniSidebarWidth: 87,
  TopbarHeight: 70,
  isCollapse: false,
  isLayout: "boxed" as ThemeLayout,
  isSidebarHover: false,
  isMobileSidebar: false,
  isHorizontal: false,
  isLanguage: "en",
  isCardShadow: true,
  borderRadius: 7,
};

export const useCustomizerStore = create<CustomizerState>()(
  persist(
    (set) => ({
      ...initialState,
      setTheme: (activeTheme) => set({ activeTheme }),
      setDarkMode: (activeMode) => set({ activeMode }),
      setDir: (activeDir) => set({ activeDir }),
      setLanguage: (isLanguage) => set({ isLanguage }),
      setCardShadow: (isCardShadow) => set({ isCardShadow }),
      toggleSidebar: () => set((state) => ({ isCollapse: !state.isCollapse })),
      hoverSidebar: (isSidebarHover) => set({ isSidebarHover }),
      toggleMobileSidebar: () =>
        set((state) => ({ isMobileSidebar: !state.isMobileSidebar })),
      toggleLayout: (isLayout) => set({ isLayout }),
      toggleHorizontal: (isHorizontal) => set({ isHorizontal }),
      setBorderRadius: (borderRadius) => set({ borderRadius }),
    }),
    {
      name: "rtl-customizer",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : localStorage,
      ),
      partialize: (state) => ({
        activeDir: state.activeDir,
        activeMode: state.activeMode,
        activeTheme: state.activeTheme,
        isCollapse: state.isCollapse,
        isLayout: state.isLayout,
        isHorizontal: state.isHorizontal,
        isLanguage: state.isLanguage,
        isCardShadow: state.isCardShadow,
        borderRadius: state.borderRadius,
      }),
    },
  ),
);