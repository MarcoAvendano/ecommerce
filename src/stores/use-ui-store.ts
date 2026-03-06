"use client";

import { create } from "zustand";

interface UiStoreState {
  isGlobalSearchOpen: boolean;
  activeDialogId: string | null;
  setGlobalSearchOpen: (isOpen: boolean) => void;
  setActiveDialogId: (dialogId: string | null) => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  isGlobalSearchOpen: false,
  activeDialogId: null,
  setGlobalSearchOpen: (isGlobalSearchOpen) => set({ isGlobalSearchOpen }),
  setActiveDialogId: (activeDialogId) => set({ activeDialogId }),
}));