import type { Accessory } from "../types/accessory";

export const accessories: Accessory[] = [
  // eyewear
  { id: "aviator", name: "Aviator", icon: "🕶️", category: "eyewear", slot: "eyewear", collections: ["men", "women", "unisex"], anchor: "eyes", tags: ["sunglasses", "black"] },
  { id: "round-specs", name: "Round Specs", icon: "👓", category: "eyewear", slot: "eyewear", collections: ["men", "women", "unisex"], anchor: "eyes", tags: ["spectacles"] },
  { id: "goggles", name: "Goggles", icon: "🥽", category: "eyewear", slot: "eyewear", collections: ["men", "unisex"], anchor: "eyes", tags: ["goggles", "cyber"] },
  { id: "wayfarer", name: "Wayfarer", icon: "😎", category: "eyewear", slot: "eyewear", collections: ["men", "unisex"], anchor: "eyes", tags: ["sunglasses"] },
  { id: "neon-shades", name: "Neon Shades", icon: "🌈", category: "eyewear", slot: "eyewear", collections: ["men", "women", "unisex"], anchor: "eyes", tags: ["party", "sunglasses"] },
  { id: "rose-specs", name: "Rose Specs", icon: "🌸", category: "eyewear", slot: "eyewear", collections: ["women", "unisex"], anchor: "eyes", tags: ["pink", "spectacles"] },
  { id: "gold-specs", name: "Gold Frames", icon: "🤓", category: "eyewear", slot: "eyewear", collections: ["men", "women", "unisex"], anchor: "eyes", tags: ["spectacles", "luxury"] },
  { id: "mirror-shades", name: "Mirror Shades", icon: "🪞", category: "eyewear", slot: "eyewear", collections: ["men", "unisex"], anchor: "eyes", tags: ["sunglasses", "silver"] },
  // headwear
  { id: "cap", name: "Street Cap", icon: "🧢", category: "headwear", slot: "head", collections: ["men", "unisex"], anchor: "head", tags: ["hat", "cap"] },
  { id: "fedora", name: "Fedora", icon: "🎩", category: "headwear", slot: "head", collections: ["men", "unisex"], anchor: "head", tags: ["hat", "formal"] },
  { id: "crown", name: "Crown", icon: "👑", category: "headwear", slot: "head", collections: ["women", "unisex"], anchor: "head", tags: ["luxury", "wedding"] },
  { id: "hair-bob", name: "Bob Cut", icon: "💇‍♀️", category: "hair", slot: "hair", collections: ["women"], anchor: "head", tags: ["hairstyle"] },
  // makeup
  { id: "bindi", name: "Red Bindi", icon: "🔴", category: "makeup", slot: "bindi", collections: ["women"], anchor: "forehead", tags: ["bindi", "traditional"] },
  { id: "gold-bindi", name: "Gold Bindi", icon: "🟡", category: "makeup", slot: "bindi", collections: ["women"], anchor: "forehead", tags: ["bindi", "wedding"] },
  { id: "eyeliner", name: "Winged Liner", icon: "✨", category: "makeup", slot: "liner", collections: ["women"], anchor: "eyes", tags: ["makeup", "eyeliner"] },
  { id: "blue-liner", name: "Blue Liner", icon: "💙", category: "makeup", slot: "liner", collections: ["women"], anchor: "eyes", tags: ["makeup", "eyeliner"] },
  { id: "lipstick", name: "Ruby Lips", icon: "💄", category: "makeup", slot: "lips", collections: ["women"], anchor: "lips", tags: ["makeup", "lipstick"] },
  { id: "nude-lips", name: "Nude Lips", icon: "👄", category: "makeup", slot: "lips", collections: ["women"], anchor: "lips", tags: ["makeup", "lipstick"] },
  { id: "plum-lips", name: "Plum Lips", icon: "🍇", category: "makeup", slot: "lips", collections: ["women"], anchor: "lips", tags: ["makeup", "lipstick"] },
  // jewelry
  { id: "chain", name: "Gold Chain", icon: "⛓️", category: "jewelry", slot: "neck", collections: ["men", "women"], anchor: "neck", tags: ["chain", "necklace"] },
  { id: "earrings", name: "Jhumka", icon: "💎", category: "jewelry", slot: "ears", collections: ["women"], anchor: "ears", tags: ["earrings", "traditional"] },
];