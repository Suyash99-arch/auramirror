import { motion } from "framer-motion";

type Card = { icon: string; label: string; top: string; offset: string; delay: number };

const left: Card[] = [
  { icon: "🕶️", label: "Aviator", top: "20%", offset: "5%", delay: 0 },
  { icon: "🧢", label: "Street Cap", top: "45%", offset: "11%", delay: 0.7 },
  { icon: "⛓️", label: "Gold Chain", top: "68%", offset: "4%", delay: 1.4 },
];

const right: Card[] = [
  { icon: "🔴", label: "Bindi", top: "22%", offset: "6%", delay: 0.3 },
  { icon: "💇‍♀️", label: "Hairstyles", top: "46%", offset: "12%", delay: 1 },
  { icon: "✨", label: "Eyeliner", top: "69%", offset: "5%", delay: 1.7 },
];

function FloatCard({ card, side }: { card: Card; side: "left" | "right" }) {
  return (
    <motion.div
      className="float-card glass"
      style={{ top: card.top, [side]: card.offset }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, y: [0, -18, 0] }}
      transition={{
        opacity: { delay: card.delay, duration: 0.6 },
        scale: { delay: card.delay, duration: 0.6 },
        y: { delay: card.delay, duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
      whileHover={{ scale: 1.12 }}
    >
      <span className="float-icon">{card.icon}</span>
      <span>{card.label}</span>
    </motion.div>
  );
}

export default function FloatingCards() {
  return (
    <>
      {left.map((c) => <FloatCard key={c.label} card={c} side="left" />)}
      {right.map((c) => <FloatCard key={c.label} card={c} side="right" />)}
    </>
  );
}