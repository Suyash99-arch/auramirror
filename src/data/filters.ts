export interface ColorFilter {
  id: string;
  name: string;
  icon: string;
  css: string; // CSS filter string, used on the live video and when saving photos
}

export const filters: ColorFilter[] = [
  { id: "none", name: "Original", icon: "◎", css: "none" },
  { id: "bw", name: "B&W", icon: "⚫", css: "grayscale(1) contrast(1.1)" },
  { id: "amber", name: "Amber", icon: "🟠", css: "sepia(0.55) saturate(1.6) hue-rotate(-12deg) brightness(1.05)" },
  { id: "vintage", name: "Vintage", icon: "📷", css: "sepia(0.4) contrast(0.9) saturate(0.8) brightness(1.08)" },
  { id: "noir", name: "Noir", icon: "🎞️", css: "grayscale(1) contrast(1.6) brightness(0.9)" },
  { id: "cool", name: "Cool", icon: "🧊", css: "sepia(0.2) hue-rotate(160deg) saturate(1.1) brightness(1.05)" },
  { id: "neon", name: "Neon", icon: "💜", css: "saturate(2) contrast(1.2) hue-rotate(-20deg)" },
  { id: "dreamy", name: "Dreamy", icon: "☁️", css: "brightness(1.12) contrast(0.88) saturate(1.3)" },
  { id: "sunset", name: "Sunset", icon: "🌅", css: "sepia(0.35) saturate(1.8) hue-rotate(-30deg) contrast(1.05)" },
  { id: "fade", name: "Fade", icon: "🌫️", css: "contrast(0.8) brightness(1.15) saturate(0.7)" },
];

export const getFilter = (id: string): ColorFilter =>
  filters.find((f) => f.id === id) ?? filters[0];