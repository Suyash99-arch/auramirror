import { useEffect, useRef } from "react";
import { dragBus } from "../../ar/dragBus";
import { accessories } from "../../data/accessories";

export default function DragGhost() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let shownId: string | null = null;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = ref.current;
      if (!el) return;

      if (!dragBus.id) {
        if (shownId) {
          shownId = null;
          el.style.opacity = "0";
        }
        return;
      }

      if (dragBus.id !== shownId) {
        shownId = dragBus.id;
        const a = accessories.find((x) => x.id === shownId);
        el.textContent = a ? a.icon : "✨";
      }
      el.style.opacity = "1";
      el.style.transform = `translate(${dragBus.x}px, ${dragBus.y}px) scale(1.15)`;
    };
    loop();

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: 76,
        height: 76,
        margin: "-38px 0 0 -38px",
        display: "grid",
        placeItems: "center",
        fontSize: "2.4rem",
        borderRadius: 22,
        background: "rgba(139, 92, 246, 0.35)",
        border: "2px solid rgba(34, 211, 238, 0.9)",
        boxShadow: "0 0 36px rgba(34, 211, 238, 0.8), 0 0 70px rgba(139, 92, 246, 0.6)",
        backdropFilter: "blur(8px)",
        pointerEvents: "none",
        zIndex: 9998,
        opacity: 0,
        transition: "opacity 0.15s",
        willChange: "transform",
      }}
    />
  );
}