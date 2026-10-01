import { memo } from "react";
import { motion } from "framer-motion";
import { filters } from "../../data/filters";
import "./FilterBar.css";

interface Props {
  active: string;
  onSelect: (id: string) => void;
}

export default memo(function FilterBar({ active, onSelect }: Props) {
  return (
    <div className="filter-bar glass">
      {filters.map((f) => (
        <button
          key={f.id}
          className={`filter-chip ${active === f.id ? "active" : ""}`}
          onClick={() => onSelect(f.id)}
          title={f.name}
        >
          {active === f.id && (
            <motion.span
              layoutId="filter-pill"
              className="filter-pill"
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            />
          )}
          <span className="filter-icon">{f.icon}</span>
          <span className="filter-name">{f.name}</span>
        </button>
      ))}
    </div>
  );
});
