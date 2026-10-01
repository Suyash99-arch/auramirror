import type { Accessory } from "../types/accessory";

export const accessories: Accessory[] = [
  { id: "aviator", name: "Aviator", icon: "🕶️", category: "eyewear", collections: ["men", "women", "unisex"], anchor: "eyes", tags: ["sunglasses", "black"] },
  { id: "round-specs", name: "Round Specs", icon: "👓", category: "eyewear", collections: ["men", "women", "unisex"], anchor: "eyes", tags: ["spectacles"] },
  { id: "goggles", name: "Goggles", icon: "🥽", category: "eyewear", collections: ["men", "unisex"], anchor: "eyes", tags: ["goggles", "cyber"] },
  { id: "cap", name: "Street Cap", icon: "🧢", category: "headwear", collections: ["men", "unisex"], anchor: "head", tags: ["hat", "cap"] },
  { id: "fedora", name: "Fedora", icon: "🎩", category: "headwear", collections: ["men", "unisex"], anchor: "head", tags: ["hat", "formal"] },
  { id: "crown", name: "Crown", icon: "👑", category: "headwear", collections: ["women", "unisex"], anchor: "head", tags: ["luxury", "wedding"] },
  { id: "hair-bob", name: "Bob Cut", icon: "💇‍♀️", category: "hair", collections: ["women"], anchor: "head", tags: ["hairstyle"] },
  { id: "bindi", name: "Red Bindi", icon: "🔴", category: "makeup", collections: ["women"], anchor: "forehead", tags: ["bindi", "traditional"] },
  { id: "eyeliner", name: "Winged Liner", icon: "✨", category: "makeup", collections: ["women"], anchor: "eyes", tags: ["makeup", "eyeliner"] },
  { id: "lipstick", name: "Ruby Lips", icon: "💄", category: "makeup", collections: ["women"], anchor: "lips", tags: ["makeup", "lipstick"] },
  { id: "chain", name: "Gold Chain", icon: "⛓️", category: "jewelry", collections: ["men", "women"], anchor: "neck", tags: ["chain", "necklace"] },
  { id: "earrings", name: "Jhumka", icon: "💎", category: "jewelry", collections: ["women"], anchor: "ears", tags: ["earrings", "traditional"] },
];