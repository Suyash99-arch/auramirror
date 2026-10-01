import { useEffect, useRef, useState, type RefObject } from "react";
import { getHandLandmarker } from "../ar/handTracking/handLandmarker";
import { handBus } from "../ar/handBus";
import { dragBus } from "../ar/dragBus";
import {
  analyzeHand,
  isValidHandFrame,
  resetHandGestureState,
  type Gesture,
} from "../gestures/gestures";

const MARGIN = 0.1;
const HOLD_MS = 900; // fist / thumbs-up hold time
const DRAG_PX = 45; // pinch + move this far = drag
const DWELL_MS = 800; // hover-and-hold time to click
const DWELL_MOVE = 38; // cursor must stay within this many px during the hold
const FREEZE_RATIO = 0.6; // below this thumb-index ratio the cursor stops following the fingertip
const SCROLL_DIRECTION = 1;
const SCROLL_DEADZONE = 0.006;
const SCROLL_EMA_ALPHA = 0.25;
const SCROLL_GAIN = 0.04;
const SCROLL_FRICTION = 0.85;
const SCROLL_SPEED = 1;
const SCROLL_MAX_PER_FRAME = 18;
const SCROLL_STOP_THRESHOLD = 0.0002;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function toScreen(p: { x: number; y: number }) {
  const nx = clamp01((p.x - MARGIN) / (1 - 2 * MARGIN));
  const ny = clamp01((p.y - MARGIN) / (1 - 2 * MARGIN));
  return { x: (1 - nx) * window.innerWidth, y: ny * window.innerHeight };
}

function railForScreenX(x: number): HTMLElement | null {
  const rails = document.querySelectorAll<HTMLElement>(".rail");
  return rails[x < window.innerWidth / 2 ? 0 : 1] ?? rails[0] ?? null;
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
  onVictoryHold: () => void, // now triggered by holding a thumbs-up (photo)
  onDrop: (id: string) => void,
) {
  const [gesture, setGesture] = useState<Gesture | "none">("none");
  const [loadError, setLoadError] = useState(false);
  const fistCb = useRef(onFistHold);
  const photoCb = useRef(onVictoryHold);
  const dropCb = useRef(onDrop);
  const previousPalmY = useRef<number | null>(null);
  const smoothedScrollDelta = useRef(0);
  const scrollVelocity = useRef(0);

  useEffect(() => {
    fistCb.current = onFistHold;
    photoCb.current = onVictoryHold;
    dropCb.current = onDrop;
  }, [onFistHold, onVictoryHold, onDrop]);

  useEffect(() => {
    if (!enabled) return;
    const cursorEl = cursorRef.current;

    let raf = 0;
    let cancelled = false;
    let lastTime = -1;
    let lastDetectionAt = 0;
    let lastGesture: Gesture | "none" = "none";

    // cursor
    const cur = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let lastKn = { x: 0, y: 0 };
    let hasCursor = false;

    // pinch / drag
    let pinching = false;
    let lastClick = 0;
    let anchor = { x: 0, y: 0 };
    let pendingEl: HTMLElement | null = null;
    let pendingId: string | null = null;
    let dragId: string | null = null;

    // hover + dwell click
    let hovered: HTMLElement | null = null;
    let dwellEl: HTMLElement | null = null;
    let dwellStart = 0;
    let dwellX = 0;
    let dwellY = 0;
    let dwellFired = false;

    // hold gestures (fist / thumbs-up)
    let holdG: Gesture | null = null;
    let holdSince = 0;
    let holdFired = false;

    let scrollRaf = 0;
    let scrollActive = false;
    let scrollRail: HTMLElement | null = null;

    const stopScroll = () => {
      scrollActive = false;
      previousPalmY.current = null;
      smoothedScrollDelta.current = 0;
      scrollVelocity.current = 0;
      scrollRail = null;
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
    };

    const scrollFrame = () => {
      if (!scrollActive || !scrollRail) {
        scrollRaf = 0;
        return;
      }
      scrollVelocity.current =
        scrollVelocity.current * SCROLL_FRICTION +
        smoothedScrollDelta.current * SCROLL_GAIN;
      const top = Math.max(
        -SCROLL_MAX_PER_FRAME,
        Math.min(
          SCROLL_MAX_PER_FRAME,
          scrollVelocity.current *
            scrollRail.clientHeight *
            SCROLL_SPEED *
            SCROLL_DIRECTION,
        ),
      );
      if (Math.abs(top) >= 0.1) scrollRail.scrollBy({ top, behavior: "auto" });

      if (
        Math.abs(scrollVelocity.current) < SCROLL_STOP_THRESHOLD &&
        Math.abs(smoothedScrollDelta.current) < SCROLL_DEADZONE
      ) {
        scrollVelocity.current = 0;
        scrollRaf = 0;
        return;
      }
      scrollRaf = requestAnimationFrame(scrollFrame);
    };

    const startScroll = () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(scrollFrame);
    };

    const setHover = (el: HTMLElement | null) => {
      if (hovered && hovered !== el) hovered.classList.remove("hand-hover");
      if (el && !el.classList.contains("hand-hover"))
        el.classList.add("hand-hover");
      hovered = el;
    };

    const elementAt = (x: number, y: number) => {
      const el = document
        .elementFromPoint(x, y)
        ?.closest("button, a") as HTMLElement | null;
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

    const resetDwell = () => {
      dwellEl = null;
      dwellFired = false;
      cursorEl?.style.setProperty("--dwell", "0");
    };

    getHandLandmarker()
      .then((landmarker) => {
        if (cancelled) return;

        const tick = () => {
          raf = requestAnimationFrame(tick);

          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.currentTime === lastTime)
            return;
          const now = performance.now();
          if (now - lastDetectionAt < 1000 / 30) return;
          lastDetectionAt = now;
          lastTime = video.currentTime;
          const result = landmarker.detectForVideo(video, now);
          handBus.hands = result.landmarks; // share with the 3D hand layer
          handBus.t = now;
          const lm = result.landmarks[0];

          // ---------- no hand ----------
          if (!lm) {
            resetHandGestureState();
            if (lastGesture !== "none") {
              lastGesture = "none";
              setGesture("none");
            }
            cursorEl?.classList.remove("on");
            setHover(null);
            pinching = false;
            cancelDrag();
            resetDwell();
            hasCursor = false;
            holdG = null;
            holdFired = false;
            stopScroll();
            return;
          }

          if (!isValidHandFrame(lm)) {
            resetHandGestureState();
            if (lastGesture !== "none") {
              lastGesture = "none";
              setGesture("none");
            }
            cursorEl?.classList.remove("on");
            setHover(null);
            pinching = false;
            cancelDrag();
            resetDwell();
            hasCursor = false;
            holdG = null;
            holdFired = false;
            stopScroll();
            return;
          }

          // ---------- stable gesture from the classifier ----------
          const info = analyzeHand(
            lm,
            video.videoWidth,
            video.videoHeight,
            pinching,
          );
          const g = info.gesture;
          const passive =
            g === "palm" || g === "fist" || g === "scroll" || g === "thumbsup";

          // ---------- cursor position ----------
          const tip = toScreen(info.tip);
          const palm = toScreen(info.palm);
          const kn = toScreen(info.knuckle);
          if (!hasCursor) {
            cur.x = target.x = tip.x;
            cur.y = target.y = tip.y;
            lastKn = kn;
            hasCursor = true;
          }
          const dk = { x: kn.x - lastKn.x, y: kn.y - lastKn.y };
          lastKn = kn;

          // pinch just started: the cursor is already frozen where you aimed
          if (g === "pinch" && !pinching) {
            pinching = true;
            anchor = { x: cur.x, y: cur.y };
            const el = elementAt(cur.x, cur.y);
            const accId = el?.dataset.accId ?? null;
            if (el && accId) {
              pendingEl = el; // card: wait to see if this is a click or a drag
              pendingId = accId;
            } else if (el && now - lastClick > 450) {
              lastClick = now;
              el.click();
            }
          }

          if (passive) {
            target = palm;
          } else if (pinching || info.pinchRatio <= FREEZE_RATIO) {
            // fingers closing: move with the knuckle (it does not shift while pinching)
            target = { x: target.x + dk.x, y: target.y + dk.y };
          } else {
            target = tip;
          }

          // adaptive smoothing: calm when slow, quick when moving fast
          const dist = Math.hypot(target.x - cur.x, target.y - cur.y);
          const alpha = Math.min(0.6, 0.14 + dist / 220);
          cur.x += (target.x - cur.x) * alpha;
          cur.y += (target.y - cur.y) * alpha;

          // ---------- drag ----------
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

          // ---------- hover + hover-and-hold click ----------
          const hoverEl =
            passive || dragId || pinching ? null : elementAt(cur.x, cur.y);
          setHover(hoverEl);

          let dwellProgress = 0;
          if (hoverEl) {
            if (hoverEl !== dwellEl) {
              dwellEl = hoverEl;
              dwellStart = now;
              dwellX = cur.x;
              dwellY = cur.y;
              dwellFired = false;
            } else if (
              Math.hypot(cur.x - dwellX, cur.y - dwellY) > DWELL_MOVE
            ) {
              dwellStart = now; // moved too much: restart the hold
              dwellX = cur.x;
              dwellY = cur.y;
            }
            if (!dwellFired) {
              dwellProgress = Math.min(1, (now - dwellStart) / DWELL_MS);
              if (dwellProgress >= 1) {
                dwellFired = true; // must leave the element before it can click again
                dwellProgress = 0;
                hoverEl.click();
              }
            }
          } else {
            dwellEl = null;
            dwellFired = false;
          }

          if (cursorEl) {
            cursorEl.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
            cursorEl.style.setProperty("--dwell", String(dwellProgress));
            cursorEl.className = `hand-cursor on ${g}${dwellProgress > 0.02 ? " dwelling" : ""}`;
          }

          // ---------- open-hand palm movement scroll ----------
          if (g === "scroll") {
            const currentY = info.palm.y;
            if (previousPalmY.current === null) {
              previousPalmY.current = currentY;
              const screenX = toScreen(info.palm).x;
              scrollRail = railForScreenX(screenX);
            } else {
              const delta = currentY - previousPalmY.current;
              previousPalmY.current = currentY;
              if (Math.abs(delta) >= SCROLL_DEADZONE) {
                smoothedScrollDelta.current +=
                  (delta - smoothedScrollDelta.current) * SCROLL_EMA_ALPHA;
              } else {
                smoothedScrollDelta.current = 0;
              }
            }
            scrollActive = !!scrollRail;
            startScroll();
          } else {
            stopScroll();
          }

          // ---------- hold gestures: fist = clear, thumbs-up = photo ----------
          if (g === "fist" || g === "thumbsup") {
            if (holdG !== g) {
              holdG = g;
              holdSince = now;
              holdFired = false;
            } else if (!holdFired && now - holdSince > HOLD_MS) {
              holdFired = true;
              (g === "fist" ? fistCb : photoCb).current();
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
      stopScroll();
      cancelDrag();
      setHover(null);
      cursorEl?.classList.remove("on");
    };
  }, [enabled, videoRef, cursorRef]);

  return { gesture, loadError };
}
