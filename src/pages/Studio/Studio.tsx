import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Camera from "../../components/Camera/Camera";
import AccessoryCard from "../../components/AccessoryCard/AccessoryCard";
import DragGhost from "../../components/DragGhost/DragGhost";
import ThreeOverlay from "../../ar/three/ThreeOverlay";
import HandSkeleton3D from "../../ar/three/HandSkeleton3D";
import { is3D } from "../../ar/three/models";
import { useCamera } from "../../hooks/useCamera";
import { useFaceTracking } from "../../hooks/useFaceTracking";
import { useHandControl } from "../../hooks/useHandControl";
import { useCapture } from "../../hooks/useCapture";
import { getFaceLandmarker } from "../../ar/faceTracking/faceLandmarker";
import { getHandLandmarker } from "../../ar/handTracking/handLandmarker";
import { useStudio } from "../../store/useStudio";
import { accessories } from "../../data/accessories";
import type { Collection } from "../../types/accessory";
import type { Gesture } from "../../gestures/gestures";
import "./Studio.css";

const tabs: Collection[] = ["men", "women", "unisex"];
const tabLabel: Record<Collection, string> = { men: "Men", women: "Women", unisex: "All" };

const categories = [
  { id: "all", label: "✦ All" },
  { id: "eyewear", label: "🕶️ Eyewear" },
  { id: "headwear", label: "🧢 Headwear" },
  { id: "hair", label: "💇‍♀️ Hair" },
  { id: "makeup", label: "💄 Makeup" },
  { id: "jewelry", label: "💎 Jewelry" },
];

const gestureLabel: Record<Gesture | "none", string> = {
  none: "🖐 Show your hand",
  point: "☝️ Pointing",
  pinch: "🤏 Pinch!",
  palm: "🖐 Scroll mode",
  fist: "✊ Hold to clear…",
  victory: "✌️ Hold to capture…",
};

export default function Studio() {
  const { videoRef, status, start } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const { collection, setCollection, worn, toggle, clear } = useStudio();
  const [category, setCategory] = useState("all");
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsFailed, setModelsFailed] = useState(false);
  const ready = status === "ready";

  // download both AI models up front so the camera starts instantly
  useEffect(() => {
    let alive = true;
    Promise.all([getFaceLandmarker(), getHandLandmarker()])
      .then(() => alive && setModelsReady(true))
      .catch(() => alive && setModelsFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  // 3D items (glasses, caps, hair, chains...) go to Three.js, the rest (makeup) stay on the 2D canvas
  const worn3D = useMemo(
    () => accessories.filter((a) => worn.includes(a.id) && is3D(a)).map((a) => a.id),
    [worn]
  );
  const worn2D = useMemo(
    () => accessories.filter((a) => worn.includes(a.id) && !is3D(a)).map((a) => a.id),
    [worn]
  );

  // dropping a dragged accessory onto the mirror wears it (never removes it)
  const handleDrop = (id: string) => {
    if (!worn.includes(id)) toggle(id);
  };

  const { faceFound, loadError } = useFaceTracking(videoRef, canvasRef, ready, worn2D);
  const shot = useCapture(videoRef, canvasRef, ready);
  const { gesture, loadError: handError } = useHandControl(
    videoRef,
    cursorRef,
    ready,
    clear,
    shot.start,
    handleDrop
  );

  const list = accessories
    .filter((a) => collection === "unisex" || a.collections.includes(collection))
    .filter((a) => category === "all" || a.category === category);
  const left = list.filter((_, i) => i % 2 === 0);
  const right = list.filter((_, i) => i % 2 === 1);
  const wornNames = accessories.filter((a) => worn.includes(a.id)).map((a) => a.name);

  return (
    <div className="studio">
      <header className="studio-top glass">
        <Link to="/" className="logo">✦ AuraMirror</Link>
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t}
              className={`tab ${collection === t ? "active" : ""}`}
              onClick={() => setCollection(t)}
            >
              {tabLabel[t]}
            </button>
          ))}
        </div>
        <div className="hud">
          <span className="status">
            {!ready ? "○ Camera off" : faceFound ? "● Face locked" : "● Looking for face…"}
          </span>
          {ready && <span className="gesture-pill">{gestureLabel[gesture]}</span>}
        </div>
      </header>

      <main className="studio-main">
        <aside className="rail">
          {left.map((a) => (
            <AccessoryCard key={a.id} item={a} active={worn.includes(a.id)} onSelect={toggle} />
          ))}
        </aside>

        <section className="stage">
          <Camera videoRef={videoRef} canvasRef={canvasRef} status={status} onStart={start} />
          {ready && <ThreeOverlay worn={worn3D} ready={ready} videoRef={videoRef} />}
          {ready && <HandSkeleton3D ready={ready} videoRef={videoRef} />}

          <div className="chips glass">
            {categories.map((c) => (
              <button
                key={c.id}
                className={`chip ${category === c.id ? "active" : ""}`}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {list.length === 0 && (
            <div className="glass empty">Nothing here yet. Try another category or tab.</div>
          )}

          {ready && (
            <div className="guide glass">
              ☝️ Point · 🤏 Pinch to select · 🤏➜ Drag onto your face · 🖐 Palm to scroll · ✊ Hold to clear · ✌️ Hold to snap
            </div>
          )}
          {shot.count !== null && <div className="countdown" key={shot.count}>{shot.count}</div>}
          {shot.flash && <div className="flash" />}

          {!modelsReady && !modelsFailed && (
            <div className="loader">
              <div className="spinner" />
              <p>Loading AI models…</p>
            </div>
          )}
          {(loadError || handError || modelsFailed) && (
            <div className="glass banner">
              AI models failed to load. Check that public/models and public/wasm exist.
            </div>
          )}
        </section>

        <aside className="rail">
          {right.map((a) => (
            <AccessoryCard key={a.id} item={a} active={worn.includes(a.id)} onSelect={toggle} />
          ))}
        </aside>
      </main>

      <footer className="studio-bottom glass">
        <span className="wearing">
          {wornNames.length ? `Wearing: ${wornNames.join(", ")}` : "Pick an accessory to try it on"}
        </span>
        <div className="actions">
          <button className="ctrl" onClick={clear}>↶ Clear</button>
          <button className="ctrl capture" onClick={shot.start} disabled={!ready || shot.count !== null}>
            ◉ Capture
          </button>
        </div>
      </footer>

      {shot.photo && (
        <div className="photo-modal">
          <div className="photo-card glass">
            <img src={shot.photo} alt="Your look" />
            <div className="photo-actions">
              <button className="btn" onClick={shot.download}>⬇ Download</button>
              <button className="ctrl" onClick={shot.close}>✕ Close</button>
            </div>
          </div>
        </div>
      )}

      <DragGhost />
      <div ref={cursorRef} className="hand-cursor" />
    </div>
  );
}