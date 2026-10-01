import { create } from "zustand";
import type { Collection } from "../types/accessory";
import { accessories } from "../data/accessories";

interface StudioState {
  collection: Collection;
  worn: string[];
  setCollection: (c: Collection) => void;
  toggle: (id: string) => void;
  clear: () => void;
}

const slotOf = (id: string) => accessories.find((a) => a.id === id)?.slot;

export const useStudio = create<StudioState>((set) => ({
  collection: "unisex",
  worn: [],
  setCollection: (collection) => set({ collection }),
  toggle: (id) =>
    set((s) => {
      if (s.worn.includes(id)) return { worn: s.worn.filter((w) => w !== id) };
      const slot = slotOf(id);
      const keep = s.worn.filter((w) => slotOf(w) !== slot); // swap items in the same slot
      return { worn: [...keep, id] };
    }),
  clear: () => set({ worn: [] }),
}));