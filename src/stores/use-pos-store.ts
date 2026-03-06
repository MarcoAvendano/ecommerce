"use client";

import { create } from "zustand";

export interface PosCartItem {
  variantId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
}

interface PosStoreState {
  items: PosCartItem[];
  customerId: string | null;
  discountCents: number;
  notes: string;
  setCustomerId: (customerId: string | null) => void;
  setDiscountCents: (discountCents: number) => void;
  setNotes: (notes: string) => void;
  addItem: (item: PosCartItem) => void;
  removeItem: (variantId: string) => void;
  reset: () => void;
}

const initialState = {
  items: [] as PosCartItem[],
  customerId: null,
  discountCents: 0,
  notes: "",
};

export const usePosStore = create<PosStoreState>((set) => ({
  ...initialState,
  setCustomerId: (customerId) => set({ customerId }),
  setDiscountCents: (discountCents) => set({ discountCents }),
  setNotes: (notes) => set({ notes }),
  addItem: (item) =>
    set((state) => {
      const existingItem = state.items.find(
        (currentItem) => currentItem.variantId === item.variantId,
      );

      if (existingItem) {
        return {
          items: state.items.map((currentItem) =>
            currentItem.variantId === item.variantId
              ? { ...currentItem, quantity: currentItem.quantity + item.quantity }
              : currentItem,
          ),
        };
      }

      return { items: [...state.items, item] };
    }),
  removeItem: (variantId) =>
    set((state) => ({
      items: state.items.filter((item) => item.variantId !== variantId),
    })),
  reset: () => set(initialState),
}));