import { Link } from "react-router-dom";

export default function Studio() {
  return (
    <main style={{ height: "100%", display: "grid", placeItems: "center" }}>
      <div className="glass" style={{ padding: 40, textAlign: "center" }}>
        <h2>Studio (camera coming in Step 3)</h2>
        <Link to="/" style={{ color: "var(--accent-2)" }}>← Back home</Link>
      </div>
    </main>
  );
}