import { type FaceGeo, type Pt } from "./geometry";

type Ctx = CanvasRenderingContext2D;

// MediaPipe face mesh landmark loops
const LIPS_OUTER = [61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146];
const LIPS_INNER = [78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95];
const LID_A = [33,246,161,160,159,158,157,173,133];
const LID_B = [263,466,388,387,386,385,384,398,362];

function loop(ctx: Ctx, pts: Pt[], ids: number[]) {
  ids.forEach((id, i) => (i ? ctx.lineTo(pts[id].x, pts[id].y) : ctx.moveTo(pts[id].x, pts[id].y)));
  ctx.closePath();
}

/* ---------- eyewear ---------- */
interface Frame { w: number; h: number; round: boolean; top: string; bottom: string; stroke: string; lw: number }

function drawFrames(ctx: Ctx, f: FaceGeo, s: Frame) {
  const u = f.eyeDist;
  const sep = u * 0.335;
  ctx.save();
  ctx.translate(f.eyeMid.x, f.eyeMid.y);
  ctx.rotate(f.roll);
  ctx.lineWidth = u * s.lw;
  ctx.strokeStyle = s.stroke;
  ctx.lineCap = "round";

  for (const sx of [-1, 1]) {
    const g = ctx.createLinearGradient(0, -u * s.h / 2, 0, u * s.h / 2);
    g.addColorStop(0, s.top);
    g.addColorStop(1, s.bottom);
    ctx.fillStyle = g;
    ctx.beginPath();
    if (s.round) ctx.ellipse(sx * sep, u * 0.03, u * s.w / 2, u * s.h / 2, 0, 0, Math.PI * 2);
    else ctx.roundRect(sx * sep - u * s.w / 2, u * 0.03 - u * s.h / 2, u * s.w, u * s.h, u * 0.1);
    ctx.fill();
    ctx.stroke();
  }
  // bridge
  ctx.beginPath();
  ctx.moveTo(-sep + u * s.w / 2, -u * 0.01);
  ctx.quadraticCurveTo(0, -u * 0.09, sep - u * s.w / 2, -u * 0.01);
  ctx.stroke();
  // arms
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * (sep + u * s.w / 2), -u * 0.01);
    ctx.lineTo(sx * u * 0.82, u * 0.02);
    ctx.stroke();
  }
  ctx.restore();
}

const aviator = (c: Ctx, f: FaceGeo) =>
  drawFrames(c, f, { w: 0.6, h: 0.5, round: true, top: "rgba(8,8,18,0.93)", bottom: "rgba(70,70,110,0.75)", stroke: "#d4af37", lw: 0.035 });

const roundSpecs = (c: Ctx, f: FaceGeo) =>
  drawFrames(c, f, { w: 0.5, h: 0.5, round: true, top: "rgba(255,255,255,0.10)", bottom: "rgba(255,255,255,0.03)", stroke: "#1b1b24", lw: 0.05 });

function goggles(ctx: Ctx, f: FaceGeo) {
  const u = f.eyeDist;
  ctx.save();
  ctx.translate(f.eyeMid.x, f.eyeMid.y);
  ctx.rotate(f.roll);
  // strap
  ctx.fillStyle = "#1b1b24";
  ctx.fillRect(-u * 0.95, -u * 0.12, u * 1.9, u * 0.22);
  // lens
  const g = ctx.createLinearGradient(-u * 0.7, 0, u * 0.7, 0);
  g.addColorStop(0, "rgba(34,211,238,0.75)");
  g.addColorStop(1, "rgba(139,92,246,0.75)");
  ctx.fillStyle = g;
  ctx.strokeStyle = "#0e0e14";
  ctx.lineWidth = u * 0.07;
  ctx.beginPath();
  ctx.roundRect(-u * 0.72, -u * 0.3, u * 1.44, u * 0.66, u * 0.25);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/* ---------- makeup ---------- */
function bindi(ctx: Ctx, f: FaceGeo) {
  const p = f.pts[9];
  const r = f.eyeDist * 0.045;
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.8);
  g.addColorStop(0, "#ff2d55");
  g.addColorStop(0.55, "#c4002b");
  g.addColorStop(1, "rgba(196,0,43,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function lipstick(ctx: Ctx, f: FaceGeo) {
  ctx.save();
  ctx.fillStyle = "rgba(190,18,60,0.62)";
  ctx.beginPath();
  loop(ctx, f.pts, LIPS_OUTER);
  loop(ctx, f.pts, LIPS_INNER);
  ctx.fill("evenodd");
  ctx.restore();
}

function eyeliner(ctx: Ctx, f: FaceGeo) {
  const u = f.eyeDist;
  const cos = Math.cos(f.roll), sin = Math.sin(f.roll);
  ctx.save();
  ctx.strokeStyle = "#0b0b0f";
  ctx.lineWidth = u * 0.03;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const lids: [number[], number][] = [[LID_A, -1], [LID_B, 1]];
  for (const [ids, dir] of lids) {
    ctx.beginPath();
    ids.forEach((id, i) => (i ? ctx.lineTo(f.pts[id].x, f.pts[id].y) : ctx.moveTo(f.pts[id].x, f.pts[id].y)));
    // wing flicking outward and up
    const o = f.pts[ids[0]];
    ctx.lineTo(o.x + dir * cos * u * 0.13 + sin * u * 0.07, o.y + dir * sin * u * 0.13 - cos * u * 0.07);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------- registry ---------- */
const drawers: Record<string, (c: Ctx, f: FaceGeo) => void> = {
  lipstick, eyeliner, bindi,
  aviator, "round-specs": roundSpecs, goggles,
};

// makeup first, eyewear on top
export const DRAW_ORDER = ["lipstick", "eyeliner", "bindi", "aviator", "round-specs", "goggles"];

export function drawWorn(ctx: Ctx, worn: string[], f: FaceGeo) {
  for (const id of DRAW_ORDER) {
    if (worn.includes(id)) drawers[id](ctx, f);
  }
}