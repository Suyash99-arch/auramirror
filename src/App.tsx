import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";

// Studio (Three.js + MediaPipe) loads only when someone opens /studio
const Studio = lazy(() => import("./pages/Studio/Studio"));
const Gallery = lazy(() => import("./pages/Gallery/Gallery"));

function StudioLoading() {
  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        placeItems: "center",
        color: "var(--muted)",
        background: "var(--bg)",
      }}
    >
      Loading studio…
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/studio"
        element={
          <Suspense fallback={<StudioLoading />}>
            <Studio />
          </Suspense>
        }
      />
      <Route
        path="/gallery"
        element={
          <Suspense fallback={<StudioLoading />}>
            <Gallery />
          </Suspense>
        }
      />
    </Routes>
  );
}
