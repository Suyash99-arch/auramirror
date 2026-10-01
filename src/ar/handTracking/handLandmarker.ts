import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let instance: Promise<HandLandmarker> | null = null;

export function getHandLandmarker(): Promise<HandLandmarker> {
  if (!instance) {
    instance = (async () => {
      const fileset = await FilesetResolver.forVisionTasks("/wasm");
      const make = (delegate: "GPU" | "CPU") =>
        HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/models/hand_landmarker.task", delegate },
          runningMode: "VIDEO",
          numHands: 1,
        });
      try {
        return await make("GPU");
      } catch {
        return await make("CPU");
      }
    })().catch((e) => {
      instance = null;
      throw e;
    });
  }
  return instance;
}