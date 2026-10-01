import { motion } from "framer-motion";
import type { Accessory } from "../../types/accessory";
import "./AccessoryCard.css";

interface Props {
  item: Accessory;
  active: boolean;
  onSelect: (id: string) => void;
}

export default function AccessoryCard({ item, active, onSelect }: Props) {
  return (
    <motion.button
      className={`acc-card glass ${active ? "active" : ""}`}
      data-acc-id={item.id}
      onClick={() => onSelect(item.id)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      layout
    >
      <span className="acc-icon">{item.icon}</span>
      <span className="acc-name">{item.name}</span>
    </motion.button>
  );
}