import { useEffect, useRef, useState, type RefObject } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { getFaceLandmarker } from "../ar/faceTracking/faceLandmarker";
import { buildFace } from "../ar/overlay/geometry";
import { drawWorn } from "../ar/overlay/drawers";
import { faceBus } from "../ar/faceBus";

export function useFaceTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
  worn: string[]
) {
  const wornRef = useRef(worn);
  const [faceFound, setFaceFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    wornRef.current = worn;
  }, [worn]);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let cancelled = false;
    let lastTime = -1;
    let lastFound = false;
    let smooth: NormalizedLandmark[] | null = null;

    getFaceLandmarker()
      .then((landmarker) => {
        if (cancelled) return;

        const tick = () => {
          raf = requestAnimationFrame(tick);
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || video.readyState < 2 || video.currentTime === lastTime) return;
          lastTime = video.currentTime;

          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
          const ctx = canvas.getContext("2d")!;
          ctx.clearRect(0, 0, w, h);

          const result = landmarker.detectForVideo(video, performance.now());
          faceBus.result = result; // share with the 3D layer
          faceBus.t = performance.now();

          const lm = result.faceLandmarks[0];
          const found = !!lm;

          if (lm) {
            // smooth the landmarks so accessories don't jitter
            smooth = smooth
              ? smooth.map((p, i) => ({
                  ...p,
                  x: p.x + (lm[i].x - p.x) * 0.6,
                  y: p.y + (lm[i].y - p.y) * 0.6,
                }))
              : lm.map((p) => ({ ...p }));
            const face = buildFace(smooth, video.videoWidth, video.videoHeight, w, h);
            drawWorn(ctx, wornRef.current, face);
          } else {
            smooth = null;
          }

          if (found !== lastFound) {
            lastFound = found;
            setFaceFound(found);
          }
        };
        tick();
      })
      .catch(() => setLoadError(true));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [enabled, videoRef, canvasRef]);

  return { faceFound, loadError };
}