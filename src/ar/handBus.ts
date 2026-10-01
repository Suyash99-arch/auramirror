import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Shares the latest hand landmarks with the 3D hand layer,
// so hand detection only runs once per frame.
export const handBus: {
  hands: NormalizedLandmark[][]; // up to 2 hands, 21 landmarks each
  t: number;
} = {
  hands: [],
  t: 0,
};