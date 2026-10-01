import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface Pt { x: number; y: number }

export interface FaceGeo {
  pts: Pt[];       // all 478 landmarks in canvas pixels
  eyeL: Pt;        // eye center on the left side of the image
  eyeR: Pt;        // eye center on the right side of the image
  eyeMid: Pt;      // point between the eyes
  eyeDist: number; // outer-corner to outer-corner distance (our unit "u")
  roll: number;    // head tilt in radians
}

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const angle = (a: Pt, b: Pt) => Math.atan2(b.y - a.y, b.x - a.x);

export function buildFace(
  lm: NormalizedLandmark[],
  vw: number, vh: number, w: number, h: number
): FaceGeo {
  const s = Math.max(w / vw, h / vh);
  const ox = (w - vw * s) / 2;
  const oy = (h - vh * s) / 2;
  const pts = lm.map((l) => ({ x: l.x * vw * s + ox, y: l.y * vh * s + oy }));

  const eyeL = mid(pts[33], pts[133]);
  const eyeR = mid(pts[362], pts[263]);
  return {
    pts,
    eyeL,
    eyeR,
    eyeMid: mid(eyeL, eyeR),
    eyeDist: dist(pts[33], pts[263]),
    roll: angle(pts[33], pts[263]),
  };
}