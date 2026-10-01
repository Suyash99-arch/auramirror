import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export function useCapture(
  videoRef: RefObject<HTMLVideoElement | null>,
  overlayRef: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
  filter: string = "none", // CSS filter string applied to the camera image
) {
  const [countdownActive, setCountdownActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const photoRef = useRef<string | null>(null);
  const busy = useRef(false);
  const flashTimer = useRef<number | null>(null);
  const filterRef = useRef(filter);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(
    () => () => {
      if (flashTimer.current !== null) clearTimeout(flashTimer.current);
    },
    [],
  );

  const snap = useCallback(() => {
    busy.current = false;
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay || !overlay.width || !overlay.height) return;

    // the Three.js canvas that holds the 3D accessories
    const three = document.querySelector<HTMLCanvasElement>(".three-layer");

    const w = overlay.width;
    const h = overlay.height;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const s = Math.max(w / vw, h / vh);

    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d")!;

    // mirrored, exactly like the live view
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);

    // colour filter applies to the camera image only
    ctx.filter = filterRef.current;
    ctx.drawImage(video, (w - vw * s) / 2, (h - vh * s) / 2, vw * s, vh * s);
    ctx.filter = "none";

    ctx.drawImage(overlay, 0, 0); // 2D makeup
    if (three && three.width && three.height) {
      ctx.drawImage(three, 0, 0, w, h); // 3D accessories on top
    }
    ctx.restore();

    ctx.font = `600 ${Math.round(w * 0.022)}px Inter, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("✦ AuraMirror", w - 20, h - 20);

    const url = out.toDataURL("image/png");
    photoRef.current = url;
    setPhoto(url);
    setFlash(true);
    if (flashTimer.current !== null) clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 350);
  }, [videoRef, overlayRef]);

  const completeCountdown = useCallback(() => {
    setCountdownActive(false);
    snap();
  }, [snap]);

  const start = useCallback(() => {
    if (!enabled || busy.current || photoRef.current) return;
    busy.current = true;
    setCountdownActive(true);
  }, [enabled]);

  const close = useCallback(() => {
    photoRef.current = null;
    busy.current = false;
    setPhoto(null);
  }, []);

  const download = useCallback(() => {
    const p = photoRef.current;
    if (!p) return;
    const a = document.createElement("a");
    a.href = p;
    a.download = `auramirror-${Date.now()}.png`;
    a.click();
  }, []);

  return {
    countdownActive,
    completeCountdown,
    flash,
    photo,
    start,
    close,
    download,
  };
}
