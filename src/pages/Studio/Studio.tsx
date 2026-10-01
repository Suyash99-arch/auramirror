import { Link } from "react-router-dom";
import Camera from "../../components/Camera/Camera";
import AccessoryCard from "../../components/AccessoryCard/AccessoryCard";
import { useCamera } from "../../hooks/useCamera";
import { useStudio } from "../../store/useStudio";
import { accessories } from "../../data/accessories";
import type { Collection } from "../../types/accessory";
import "./Studio.css";

const tabs: Collection[] = ["men", "women", "unisex"];

export default function Studio() {
  const { videoRef, status, start } = useCamera();
  const { collection, setCollection, worn, toggle, clear } = useStudio();

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
        <span className="status">{status === "ready" ? "● Live" : "○ Camera off"}</span>
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