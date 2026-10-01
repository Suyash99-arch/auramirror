import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type Gesture =
  | "point"
  | "pinch"
  | "palm"
  | "fist"
  | "scroll"
  | "thumbsup";

export interface HandInfo {
  gesture: Gesture;
  pinchRatio: number;
  tip: { x: number; y: number }; // index fingertip (0..1)
  palm: { x: number; y: number }; // palm center (0..1)
  knuckle: { x: number; y: number }; // index knuckle (0..1), stays still while pinching
}

const FINGERS: [mcp: number, pip: number, tip: number][] = [
  [5, 6, 8],
  [9, 10, 12],
  [13, 14, 16],
  [17, 18, 20],
];

const d = (
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  vw: number,
  vh: number,
) => Math.hypot((a.x - b.x) * vw, (a.y - b.y) * vh);

const fingerStates = [false, false, false, false];
let thumbExtended = false;
let stableGesture: Gesture = "point";
let candidateGesture: Gesture | null = null;
let candidateFrames = 0;

export function isValidHandFrame(lm: NormalizedLandmark[]): boolean {
  return (
    lm.length >= 21 &&
    lm.every(
      (point) =>
        point.x >= 0.02 &&
        point.x <= 0.98 &&
        point.y >= 0.02 &&
        point.y <= 0.98,
    )
  );
}

export function resetHandGestureState() {
  fingerStates.fill(false);
  thumbExtended = false;
  stableGesture = "point";
  candidateGesture = null;
  candidateFrames = 0;
}

export function analyzeHand(
  lm: NormalizedLandmark[],
  vw: number,
  vh: number,
  wasPinching: boolean,
): HandInfo {
  const size = d(lm[0], lm[9], vw, vh) || 1;
  const pinchRatio = d(lm[4], lm[8], vw, vh) / size;
  const ext = FINGERS.map(([mcp, pip, tip], index) => {
    const wristTip = d(lm[tip], lm[0], vw, vh) / size;
    const wristPip = d(lm[pip], lm[0], vw, vh) / size;
    const mcpTip = d(lm[tip], lm[mcp], vw, vh) / size;
    const mcpPip = d(lm[pip], lm[mcp], vw, vh) / size;
    const reachRatio = wristTip / Math.max(wristPip, 0.001);
    const mcpClearance = mcpTip > mcpPip * 1.05;

    if (fingerStates[index]) {
      if (reachRatio < 1.05 || mcpTip < mcpPip * 0.95)
        fingerStates[index] = false;
    } else if (reachRatio > 1.2 && mcpClearance) {
      fingerStates[index] = true;
    }
    return fingerStates[index];
  });
  const extended = ext.filter(Boolean).length;

  const thumbReach = d(lm[4], lm[5], vw, vh) / size;
  if (thumbExtended ? thumbReach < 0.55 : thumbReach > 0.7) {
    thumbExtended = !thumbExtended;
  }
  const thumbUp = (lm[2].y - lm[4].y) * vh > size * 0.22;
  const pinching = pinchRatio < (wasPinching ? 0.38 : 0.28);

  let classified: Gesture | null = null;
  if (pinching) classified = "pinch";
  else if (extended === 4 && thumbExtended) classified = "scroll";
  else if (extended === 1 && ext[0] && !thumbExtended) classified = "point";
  else if (extended === 0 && thumbExtended && thumbUp) classified = "thumbsup";
  else if (extended === 0 && !thumbExtended) classified = "fist";

  if (classified === null) {
    candidateGesture = null;
    candidateFrames = 0;
  } else if (classified === stableGesture) {
    candidateGesture = null;
    candidateFrames = 0;
  } else {
    if (classified === candidateGesture) candidateFrames++;
    else {
      candidateGesture = classified;
      candidateFrames = 1;
    }
    const framesRequired =
      classified === "pinch" || stableGesture === "pinch" ? 3 : 6;
    if (candidateFrames >= framesRequired) {
      stableGesture = classified;
      candidateGesture = null;
      candidateFrames = 0;
    }
  }

  return {
    gesture: stableGesture,
    pinchRatio,
    tip: { x: lm[8].x, y: lm[8].y },
    palm: {
      x: (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5,
      y: (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5,
    },
    knuckle: { x: lm[5].x, y: lm[5].y },
  };
}
