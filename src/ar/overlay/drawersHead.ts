import type { FaceGeo, Pt } from "./geometry";

type Ctx = CanvasRenderingContext2D;
type Draw = (c: Ctx, f: FaceGeo) => void;

const FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function local(ctx: Ctx, p: Pt, roll: number) {
  ctx.translate(p.x, p.y);
  ctx.rotate(roll);
}

/* ---------- headwear ---------- */
const cap: Draw = (ctx, f) => {
  const u = f.eyeDist, hw = f.headW;
  ctx.save();
  local(ctx, f.top, f.roll);

  const g = ctx.createLinearGradient(0, -u, 0, 0);
  g.addColorStop(0, "#60a5fa");
  g.addColorStop(1, "#1d4ed8");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.56, u * 0.12);
  ctx.bezierCurveTo(-hw * 0.62, -u * 1.05, hw * 0.62, -u * 1.05, hw * 0.56, u * 0.12);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = u * 0.015;
  ctx.beginPath();
  ctx.moveTo(0, -u * 0.76);
  ctx.lineTo(0, u * 0.1);
  ctx.stroke();
  ctx.fillStyle = "#1e3a8a";
  ctx.beginPath();
  ctx.arc(0, -u * 0.76, u * 0.035, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#172554"; // visor
  ctx.beginPath();
  ctx.ellipse(0, u * 0.12, hw * 0.64, u * 0.2, 0, 0, Math.PI);
  ctx.fill();
  ctx.restore();
};

const fedora: Draw = (ctx, f) => {
  const u = f.eyeDist, hw = f.headW;
  ctx.save();
  local(ctx, f.top, f.roll);

  ctx.fillStyle = "#26262e"; // brim
  ctx.beginPath();
  ctx.ellipse(0, -u * 0.02, hw * 0.8, u * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  const g = ctx.createLinearGradient(-hw * 0.5, 0, hw * 0.5, 0);
  g.addColorStop(0, "#3a3a46");
  g.addColorStop(0.5, "#4f4f5e");
  g.addColorStop(1, "#33333d");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.5, -u * 0.05);
  ctx.bezierCurveTo(-hw * 0.55, -u * 0.9, -hw * 0.2, -u * 0.95, 0, -u * 0.8);
  ctx.bezierCurveTo(hw * 0.2, -u * 0.95, hw * 0.55, -u * 0.9, hw * 0.5, -u * 0.05);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d4af37"; // band
  ctx.fillRect(-hw * 0.5, -u * 0.22, hw, u * 0.1);
  ctx.restore();
};

const crown: Draw = (ctx, f) => {
  const u = f.eyeDist;
  const W = f.headW * 0.8;
  const by = (x: number) => u * 0.1 * Math.pow(x / (W / 2), 2);
  const n = 5, step = W / n;
  const tips: Pt[] = [];

  ctx.save();
  local(ctx, f.top, f.roll);
  ctx.translate(0, -u * 0.05);
  ctx.beginPath();
  ctx.moveTo(-W / 2, by(-W / 2));
  for (let i = 0; i < n; i++) {
    const xl = -W / 2 + i * step, xm = xl + step / 2, xr = xl + step;
    const h = i === 2 ? u * 0.55 : i % 2 === 0 ? u * 0.4 : u * 0.3;
    const tip = { x: xm, y: by(xm) - h };
    tips.push(tip);
    ctx.lineTo(tip.x, tip.y);
    ctx.lineTo(xr, by(xr));
  }
  ctx.lineTo(W / 2, by(W / 2) + u * 0.1);
  ctx.lineTo(-W / 2, by(-W / 2) + u * 0.1);
  ctx.closePath();

  const g = ctx.createLinearGradient(0, -u * 0.6, 0, u * 0.2);
  g.addColorStop(0, "#fff0a8");
  g.addColorStop(1, "#c8962a");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#8a6d1d";
  ctx.lineWidth = u * 0.02;
  ctx.stroke();

  tips.forEach((t, i) => {
    ctx.fillStyle = i % 2 ? "#22d3ee" : "#f43f5e";
    ctx.beginPath();
    ctx.arc(t.x, t.y, u * 0.03, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};

/* ---------- hair ---------- */
const hairBob: Draw = (ctx, f) => {
  const u = f.eyeDist, hw = f.headW;
  const g = ctx.createLinearGradient(0, f.eyeMid.y - u * 1.6, 0, f.eyeMid.y + u);
  g.addColorStop(0, "#1a1118");
  g.addColorStop(1, "#3d2432");

  // outer hair mass with the face cut out
  ctx.save();
  ctx.beginPath();
  ctx.save();
  ctx.translate(f.eyeMid.x, f.eyeMid.y);
  ctx.rotate(f.roll);
  ctx.moveTo(-hw * 0.58, u * 0.95);
  ctx.bezierCurveTo(-hw * 0.95, u * 0.2, -hw * 0.85, -u * 1.6, 0, -u * 1.6);
  ctx.bezierCurveTo(hw * 0.85, -u * 1.6, hw * 0.95, u * 0.2, hw * 0.58, u * 0.95);
  ctx.closePath();
  ctx.restore();
  FACE_OVAL.forEach((id, i) =>
    i ? ctx.lineTo(f.pts[id].x, f.pts[id].y) : ctx.moveTo(f.pts[id].x, f.pts[id].y)
  );
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill("evenodd");
  ctx.restore();

  // fringe over the forehead
  ctx.save();
  ctx.translate(f.eyeMid.x, f.eyeMid.y);
  ctx.rotate(f.roll);
  ctx.beginPath();
  ctx.moveTo(-hw * 0.62, -u * 1.0);
  ctx.bezierCurveTo(-hw * 0.3, -u * 1.3, hw * 0.4, -u * 1.3, hw * 0.62, -u * 1.0);
  ctx.lineTo(hw * 0.56, -u * 0.55);
  ctx.bezierCurveTo(hw * 0.2, -u * 0.95, -hw * 0.25, -u * 0.8, -hw * 0.58, -u * 0.42);
  ctx.closePath();
  ctx.fillStyle = "#22141c";
  ctx.fill();
  ctx.restore();
};

/* ---------- jewelry ---------- */
const chain: Draw = (ctx, f) => {
  const u = f.eyeDist, hw = f.headW;
  ctx.save();
  local(ctx, f.chin, f.roll * 0.6);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-hw * 0.34, u * 0.3);
    ctx.bezierCurveTo(-hw * 0.3, u * 1.45, hw * 0.3, u * 1.45, hw * 0.34, u * 0.3);
  };
  ctx.lineCap = "round";
  path();
  ctx.strokeStyle = "#8a6d1d";
  ctx.lineWidth = u * 0.085;
  ctx.stroke();
  path();
  ctx.strokeStyle = "#f5d66b";
  ctx.lineWidth = u * 0.06;
  ctx.setLineDash([u * 0.07, u * 0.03]);
  ctx.stroke();
  ctx.setLineDash([]);

  const py = u * 1.16; // pendant
  ctx.fillStyle = "#f5d66b";
  ctx.strokeStyle = "#8a6d1d";
  ctx.lineWidth = u * 0.02;
  ctx.beginPath();
  ctx.moveTo(0, py - u * 0.1);
  ctx.lineTo(u * 0.09, py + u * 0.02);
  ctx.lineTo(0, py + u * 0.15);
  ctx.lineTo(-u * 0.09, py + u * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

const earrings: Draw = (ctx, f) => {
  const u = f.eyeDist;
  const ex = { x: Math.cos(f.roll), y: Math.sin(f.roll) };
  const lobes: [Pt, number][] = [
    [lerp(f.pts[234], f.pts[93], 0.55), -1],
    [lerp(f.pts[454], f.pts[323], 0.55), 1],
  ];
  for (const [p, dir] of lobes) {
    ctx.save();
    ctx.translate(p.x + ex.x * dir * u * 0.05, p.y + ex.y * dir * u * 0.05);
    ctx.rotate(f.roll);

    ctx.fillStyle = "#f5d66b";
    ctx.strokeStyle = "#8a6d1d";
    ctx.lineWidth = u * 0.012;
    ctx.beginPath(); // stud
    ctx.arc(0, 0, u * 0.035, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath(); // bell
    ctx.moveTo(-u * 0.09, u * 0.2);
    ctx.bezierCurveTo(-u * 0.09, u * 0.04, u * 0.09, u * 0.04, u * 0.09, u * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (const x of [-0.06, 0, 0.06]) {
      ctx.beginPath();
      ctx.arc(x * u, u * 0.2, u * 0.022, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff7e6"; // pearl
    ctx.beginPath();
    ctx.arc(0, u * 0.3, u * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

export const headRegistry: Record<string, { layer: number; draw: Draw }> = {
  "hair-bob": { layer: 0, draw: hairBob },
  chain: { layer: 3, draw: chain },
  earrings: { layer: 3, draw: earrings },
  cap: { layer: 4, draw: cap },
  fedora: { layer: 4, draw: fedora },
  crown: { layer: 4, draw: crown },
};