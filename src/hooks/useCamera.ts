import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "loading" | "ready" | "denied" | "error";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setStatus("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setStatus("ready");
    } catch (e) {
      setStatus(e instanceof DOMException && e.name === "NotAllowedError" ? "denied" : "error");
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, status, start, stop };
}