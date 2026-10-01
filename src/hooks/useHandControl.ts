import { useEffect, useRef, useState, type RefObject } from "react";
import { getHandLandmarker } from "../ar/handTracking/handLandmarker";
import { handBus } from "../ar/handBus";
import { dragBus } from "../ar/dragBus";
import { analyzeHand, type Gesture } from "../gestures/gestures";

const MARGIN = 0.1;
const HOLD_MS = 900;
const DRAG_PX = 45; // how far you move while pinching before it becomes a drag
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function toScreen(p: { x: number; y: number }) {
  const nx = clamp01((p.x - MARGIN) / (1 - 2 * MARGIN));
  const ny = clamp01((p.y - MARGIN) / (1 - 2 * MARGIN));
  return { x: (1 - nx) * window.innerWidth, y: ny * window.innerHeight };
}

function nearestRail(x: number): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestDist = Infinity;
  document.querySelectorAll<HTMLElement>(".rail").forEach((r) => {
    const b = r.getBoundingClientRect();
    const dist = Math.abs((b.left + b.right) / 2 - x);
    if (dist < bestDist) {
      bestDist = dist;
      best = r;
    }
  });
  return best;
}

function overStage(x: number, y: number) {
  const el = document.querySelector<HTMLElement>(".stage");
  if (!el) return false;
  const b = el.getBoundingClientRect();
  return x > b.left && x < b.right && y > b.top && y < b.bottom;
}

export function useHandControl(
  videoRef: RefObject<HTMLVideoElement | null>,
  cursorRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  onFistHold: () => void,
  onVictoryHold: () => void,
  onDrop: (id: string) => void
) {
  const [gesture, setGesture] = useState<Gesture | "none">("none");
  const [loadError, setLoadError] = useState(false);
  const fistCb = useRef(onFistHold);
  const victoryCb = useRef(onVictoryHold);
  const dropCb = useRef(onDrop);

  useEffect(() => {
    fistCb.current = onFistHold;
    victoryCb.current = onVictoryHold;
    dropCb.current = onDrop;
  }, [onFistHold, onVictoryHold, onDrop]);

  useEffect(() => {
    if (!enabled) return;
    const cursorEl = cursorRef.current;

    let raf = 0;
    let cancelled = false;
    let lastTime = -1;
    let lastGesture: Gesture | "none" = "none";

    const cur = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let hasCursor = false;
    let pinching = false;
    let lastClick = 0;
    let hovered: HTMLElement | null = null;
    let holdG: Gesture | null = null;
    let holdSince = 0;
    let holdFired = false;
    let prevY: number | null = null;
    let scrollV = 0;
    let activeRail: HTMLElement | null = null;

    // pinch-and-drag state
    let anchor = { x: 0, y: 0 };
    let midStart = { x: 0, y: 0 };
    let pendingEl: HTMLElement | null = null;
    let pendingId: string | null = null;
    let dragId: string | null = null;

    const setHover = (el: HTMLElement | null) => {
      if (hovered && hovered !== el) hovered.classList.remove("hand-hover");
      if (el && !el.classList.contains("hand-hover")) el.classList.add("hand-hover");
      hovered = el;
    };

    const elementAt = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y)?.closest("button, a") as HTMLElement | null;
      if (!el || (el as HTMLButtonElement).disabled) return null;
      return el;
    };

    const stageEl = () => document.querySelector<HTMLElement>(".stage");

    const cancelDrag = () => {
      dragId = null;
      pendingEl = null;
      pendingId = null;
      dragBus.id = null;
      stageEl()?.classList.remove("drop-ready");
    };

    getHandLandmarker()
      .then((landmarker) => {
        if (cancelled) return;

        const tick = () => {
          raf = requestAnimationFrame(tick);

          if (Math.abs(scrollV) > 0.3 && activeRail) {
            activeRail.scrollTop += scrollV;
            scrollV *= 0.9;
          } else {
            scrollV = 0;
          }

          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.currentTime === lastTime) return;
          lastTime = video.currentTime;

          const now = performance.now();
          const result = landmarker.detectForVideo(video, now);
          handBus.hands = result.landmarks; // share with the 3D hand layer
          handBus.t = now;
          const lm = result.landmarks[0];

          if (!lm) {
            if (lastGesture !== "none") {
              lastGesture = "none";
              setGesture("none");
            }
            cursorEl?.classList.remove("on");
            setHover(null);
            pinching = false;
            cancelDrag();
            hasCursor = false;
            prevY = null;
            holdG = null;
            holdFired = false;
            return;
          }

          const info = analyzeHand(lm, video.videoWidth, video.videoHeight, pinching);
          const g = info.gesture;
          const passive = g === "palm" || g === "fist" || g === "victory";

          const tip = toScreen(info.tip);
          if (!hasCursor) {
            cur.x = target.x = tip.x;
            cur.y = target.y = tip.y;
            hasCursor = true;
          }

          // midpoint between thumb tip and index tip = the "pinch point"
          const midScreen = toScreen({
            x: (lm[4].x + lm[8].x) / 2,
            y: (lm[4].y + lm[8].y) / 2,
          });

          // pinch just started
          if (g === "pinch" && !pinching) {
            pinching = true;
            anchor = { x: cur.x, y: cur.y };
            midStart = midScreen;
            const el = elementAt(cur.x, cur.y);
            const accId = el?.dataset.accId ?? null;
            if (el && accId) {
              // accessory card: wait to see if this is a click or a drag
              pendingEl = el;
              pendingId = accId;
            } else if (el && now - lastClick > 450) {
              lastClick = now;
              el.click();
            }
          }

          // cursor target
          if (g === "pinch") {
            // move relative to where the pinch started (no jump when fingers close)
            target = {
              x: anchor.x + (midScreen.x - midStart.x),
              y: anchor.y + (midScreen.y - midStart.y),
            };
          } else if (passive) {
            target = toScreen(info.palm);
          } else if (info.pinchRatio > 0.65) {
            target = tip;
          }
          cur.x += (target.x - cur.x) * 0.45;
          cur.y += (target.y - cur.y) * 0.45;

          // pinch held: start dragging once the hand has moved far enough
          if (g === "pinch" && pendingId && !dragId) {
            if (Math.hypot(cur.x - anchor.x, cur.y - anchor.y) > DRAG_PX) {
              dragId = pendingId;
              dragBus.id = dragId;
            }
          }
          if (dragId) {
            dragBus.x = cur.x;
            dragBus.y = cur.y;
            stageEl()?.classList.toggle("drop-ready", overStage(cur.x, cur.y));
          }

          // pinch released
          if (g !== "pinch" && pinching) {
            pinching = false;
            if (dragId) {
              if (overStage(cur.x, cur.y)) dropCb.current(dragId);
            } else if (pendingEl && now - lastClick > 450) {
              lastClick = now;
              pendingEl.click(); // quick pinch with no movement = click
            }
            cancelDrag();
          }

          if (cursorEl) {
            cursorEl.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
            cursorEl.className = `hand-cursor on ${g}`;
          }

          setHover(passive || dragId ? null : elementAt(cur.x, cur.y));

          // open palm = scroll
          if (g === "palm") {
            if (prevY !== null) {
              const dy = cur.y - prevY;
              if (Math.abs(dy) > 2) scrollV = -dy * 0.8;
              activeRail = nearestRail(cur.x);
            }
            prevY = cur.y;
          } else {
            prevY = null;
          }

          // fist = clear, peace sign = capture (hold for ~1 second)
          if (g === "fist" || g === "victory") {
            if (holdG !== g) {
              holdG = g;
              holdSince = now;
              holdFired = false;
            } else if (!holdFired && now - holdSince > HOLD_MS) {
              holdFired = true;
              (g === "fist" ? fistCb : victoryCb).current();
            }
          } else {
            holdG = null;
            holdFired = false;
          }

          if (g !== lastGesture) {
            lastGesture = g;
            setGesture(g);
          }
        };
        tick();
      })
      .catch(() => setLoadError(true));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cancelDrag();
      setHover(null);
      cursorEl?.classList.remove("on");
    };
  }, [enabled, videoRef, cursorRef]);

  return { gesture, loadError };
}