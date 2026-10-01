import { useEffect, useRef, useState, type RefObject } from "react";
import { getHandLandmarker } from "../ar/handTracking/handLandmarker";
import { analyzeHand, type Gesture } from "../gestures/gestures";

const MARGIN = 0.1;
const HOLD_MS = 900;
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

export function useHandControl(
  videoRef: RefObject<HTMLVideoElement | null>,
  cursorRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  onFistHold: () => void,
  onVictoryHold: () => void
) {
  const [gesture, setGesture] = useState<Gesture | "none">("none");
  const [loadError, setLoadError] = useState(false);
  const fistCb = useRef(onFistHold);
  const victoryCb = useRef(onVictoryHold);

  useEffect(() => {
    fistCb.current = onFistHold;
    victoryCb.current = onVictoryHold;
  }, [onFistHold, onVictoryHold]);

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
          const lm = landmarker.detectForVideo(video, now).landmarks[0];

          if (!lm) {
            if (lastGesture !== "none") {
              lastGesture = "none";
              setGesture("none");
            }
            cursorEl?.classList.remove("on");
            setHover(null);
            pinching = false;
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
          } else if (passive) {
            target = toScreen(info.palm);
          } else if (g !== "pinch" && info.pinchRatio > 0.65) {
            target = tip;
          }
          cur.x += (target.x - cur.x) * 0.45;
          cur.y += (target.y - cur.y) * 0.45;

          if (cursorEl) {
            cursorEl.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
            cursorEl.className = `hand-cursor on ${g}`;
          }

          setHover(passive ? null : elementAt(cur.x, cur.y));

          // pinch = click
          if (g === "pinch") {
            if (!pinching) {
              pinching = true;
              const el = elementAt(cur.x, cur.y);
              if (el && now - lastClick > 450) {
                lastClick = now;
                el.click();
              }
            }
          } else {
            pinching = false;
          }

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
      setHover(null);
      cursorEl?.classList.remove("on");
    };
  }, [enabled, videoRef, cursorRef]);

  return { gesture, loadError };
}