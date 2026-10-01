import { useRef } from "react";
import { Link } from "react-router-dom";
import Camera from "../../components/Camera/Camera";
import AccessoryCard from "../../components/AccessoryCard/AccessoryCard";
import { useCamera } from "../../hooks/useCamera";
import { useFaceTracking } from "../../hooks/useFaceTracking";
import { useHandControl } from "../../hooks/useHandControl";
import { useStudio } from "../../store/useStudio";
import { accessories } from "../../data/accessories";
import type { Collection } from "../../types/accessory";
import type { Gesture } from "../../gestures/gestures";
import "./Studio.css";

const tabs: Collection[] = ["men", "women", "unisex"];
const tabLabel: Record<Collection, string> = { men: "Men", women: "Women", unisex: "All" };

const gestureLabel: Record<Gesture | "none", string> = {
  none: "🖐 Show your hand",
  point: "☝️ Pointing",
  pinch: "🤏 Pinch!",
  palm: "🖐 Scroll mode",
  fist: "✊ Hold to clear…",
};

export default function Studio() {
  const { videoRef, status, start } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const { collection, setCollection, worn, toggle, clear } = useStudio();
  const ready = status === "ready";

  const { faceFound, loadError } = useFaceTracking(videoRef, canvasRef, ready, worn);
  const { gesture, loadError: handError } = useHandControl(videoRef, cursorRef, ready, clear);

  const list = collection === "unisex" ? accessories : accessories.filter((a) => a.collections.includes(collection));
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
          {ready && (
            <div className="guide glass">
              ☝️ Point &nbsp;·&nbsp; 🤏 Pinch to select &nbsp;·&nbsp; 🖐 Palm up/down to scroll &nbsp;·&nbsp; ✊ Hold to clear
            </div>
          )}
          {(loadError || handError) && (
            <div className="glass banner">
              {loadError ? "Face model failed to load." : "Hand model failed to load."} Check public/models and public/wasm.
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
          <button className="ctrl capture" disabled>◉ Capture</button>
        </div>
      </footer>

      <div ref={cursorRef} className="hand-cursor" />
    </div>
  );
}