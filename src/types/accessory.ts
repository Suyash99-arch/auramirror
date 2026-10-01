export type Collection = "men" | "women" | "unisex";

export type Anchor =
  | "eyes" | "forehead" | "head" | "neck" | "ears" | "lips" | "face";

export interface Accessory {
  id: string;
  name: string;
  icon: string;
  category: string;
  collections: Collection[];
  anchor: Anchor;
  tags: string[];
  model?: string;
}