import { create } from "zustand";
import type { Collection } from "../types/accessory";

interface StudioState {
  collection: Collection;
  worn: string[];
  setCollection: (c: Collection) => void;
  toggle: (id: string) => void;
  clear: () => void;
}

export const useStudio = create<StudioState>((set) => ({
  collection: "unisex",
  worn: [],
  setCollection: (collection) => set({ collection }),
  toggle: (id) =>
    set((s) => ({
      worn: s.worn.includes(id) ? s.worn.filter((w) => w !== id) : [...s.worn, id],
    })),
  clear: () => set({ worn: [] }),
}));