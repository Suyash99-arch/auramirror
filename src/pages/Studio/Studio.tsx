import { useRef } from "react";
import { Link } from "react-router-dom";
import Camera from "../../components/Camera/Camera";
import AccessoryCard from "../../components/AccessoryCard/AccessoryCard";
import { useCamera } from "../../hooks/useCamera";
import { useFaceTracking } from "../../hooks/useFaceTracking";

const tabs: Collection[] = ["men", "women", "unisex"];

export default function Studio() {
  const { videoRef, canvasRef, status, start } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { collection, setCollection, worn, toggle, clear } = useStudio();
  const { faceFound, loadError } = useFaceTracking(videoRef, canvasRef, status === "ready", worn);

  const list = accessories.filter((a) => a.collections.includes(collection));
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
              {t}
            </button>
          ))}
        </div>
                <section className="stage">
          <Camera videoRef={videoRef} canvasRef={canvasRef} status={status} onStart={start} />
          {loadError && (
            <div className="glass" style={{ position: "absolute", top: 16, left: 16, padding: "10px 16px", fontSize: "0.85rem" }}>
              Face model failed to load. Check that public/models and public/wasm exist.
            </div>
          )}
        </section>
      </header>

      <main className="studio-main">
        <aside className="rail">
          {left.map((a) => (
            <AccessoryCard key={a.id} item={a} active={worn.includes(a.id)} onSelect={toggle} />
          ))}
        </aside>

        <section className="stage">
          <Camera videoRef={videoRef} status={status} onStart={start} />
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
    </div>
  );
}