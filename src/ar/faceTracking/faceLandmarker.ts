import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let instance: Promise<FaceLandmarker> | null = null;

export function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!instance) {
    instance = (async () => {
      const fileset = await FilesetResolver.forVisionTasks("/wasm");
      const make = (delegate: "GPU" | "CPU") =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: true, // head rotation + position for 3D
        });
      try {
        return await make("GPU");
      } catch {
        return await make("CPU"); // fallback if GPU isn't available
      }
    })().catch((e) => {
      instance = null;
      throw e;
    });
  }
  return instance;
}