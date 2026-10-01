import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type Gesture = "point" | "pinch" | "palm" | "fist";

export interface HandInfo {
  gesture: Gesture;
  pinchRatio: number;
  tip: { x: number; y: number };  // index fingertip (0..1)
  palm: { x: number; y: number }; // palm center (0..1)
}

// [fingertip, pip joint] for index, middle, ring, pinky
const FINGERS: [number, number][] = [[8, 6], [12, 10], [16, 14], [20, 18]];

const d = (a: NormalizedLandmark, b: NormalizedLandmark, vw: number, vh: number) =>
  Math.hypot((a.x - b.x) * vw, (a.y - b.y) * vh);

export function analyzeHand(
  lm: NormalizedLandmark[],
  vw: number,
  vh: number,
  wasPinching: boolean
): HandInfo {
  const size = d(lm[0], lm[9], vw, vh) || 1;                 // wrist to middle knuckle
  const pinchRatio = d(lm[4], lm[8], vw, vh) / size;         // thumb tip to index tip
  const indexReach = d(lm[8], lm[0], vw, vh) / size;         // curled index = small
  const extended = FINGERS.filter(
    ([tip, pip]) => d(lm[tip], lm[0], vw, vh) > d(lm[pip], lm[0], vw, vh) * 1.08
  ).length;

  let gesture: Gesture = "point";
  if (pinchRatio < (wasPinching ? 0.5 : 0.3) && indexReach > 0.95) gesture = "pinch";
  else if (extended === 4) gesture = "palm";
  else if (extended === 0) gesture = "fist";

  return {
    gesture,
    pinchRatio,
    tip: { x: lm[8].x, y: lm[8].y },
    palm: { x: lm[9].x, y: lm[9].y },
  };
}