import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

// Shares the latest face result with the 3D layer,
// so face detection only runs once per frame.
export const faceBus: { result: FaceLandmarkerResult | null; t: number } = {
  result: null,
  t: 0,
};