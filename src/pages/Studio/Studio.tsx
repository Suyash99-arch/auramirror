import { useRef } from "react";
import { Link } from "react-router-dom";
import Camera from "../../components/Camera/Camera";
import AccessoryCard from "../../components/AccessoryCard/AccessoryCard";
import { useCamera } from "../../hooks/useCamera";
import { useFaceTracking } from "../../hooks/useFaceTracking";
import { useHandControl } from "../../hooks/useHandControl";
import { useCapture } from "../../hooks/useCapture";
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
  victory: "✌️ Hold to capture…",
};

export default function Studio() {
  const { videoRef, status, start } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const { collection, setCollection, worn, toggle, clear } = useStudio();
  const ready = status === "ready";

  const { faceFound, loadError } = useFaceTracking(videoRef, canvasRef, ready, worn);
  const shot = useCapture(videoRef, canvasRef, ready);
  const { gesture, loadError: handError } = useHandControl(videoRef, cursorRef, ready, clear, shot.start);

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
              ☝️ Point · 🤏 Pinch to select · 🖐 Palm up/down to scroll · ✊ Hold to clear · ✌️ Hold to snap
            </div>
          )}
          {shot.count !== null && <div className="countdown" key={shot.count}>{shot.count}</div>}
          {shot.flash && <div className="flash" />}
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

      <div ref={cursorRef} className="hand-cursor" />
    </div>
  );
}