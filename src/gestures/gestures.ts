import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type Gesture = "point" | "pinch" | "palm" | "fist" | "victory";

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
  const size = d(lm[0], lm[9], vw, vh) || 1;
  const pinchRatio = d(lm[4], lm[8], vw, vh) / size;
  const indexReach = d(lm[8], lm[0], vw, vh) / size;
  const ext = FINGERS.map(
    ([tip, pip]) => d(lm[tip], lm[0], vw, vh) > d(lm[pip], lm[0], vw, vh) * 1.08
  );
  const extended = ext.filter(Boolean).length;

  let gesture: Gesture = "point";
  if (pinchRatio < (wasPinching ? 0.5 : 0.3) && indexReach > 0.95) gesture = "pinch";
  else if (extended === 4) gesture = "palm";
  else if (ext[0] && ext[1] && !ext[2] && !ext[3]) gesture = "victory";
  else if (extended === 0) gesture = "fist";

  return {
    gesture,
    pinchRatio,
    tip: { x: lm[8].x, y: lm[8].y },
    palm: { x: lm[9].x, y: lm[9].y },
  };
}