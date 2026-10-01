import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ---------------------------------------------------------------
   Reflection environment: makes metal and glass look real
---------------------------------------------------------------- */
export function makeEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return env;
}

/* ---------------------------------------------------------------
   Colour helpers
---------------------------------------------------------------- */
export const hueOf = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};

export const hsl = (h: number, s = 0.75, l = 0.5) =>
  new THREE.Color().setHSL((((h % 360) + 360) % 360) / 360, s, l);

export const GOLD = 0xe6b84a;
export const SILVER = 0xdfe3ec;
export const ROSE_GOLD = 0xe8a98f;
export const BLACK = 0x0d0d12;

/* ---------------------------------------------------------------
   Materials
---------------------------------------------------------------- */
export const metal = (color: THREE.ColorRepresentation = GOLD, rough = 0.18) =>
  new THREE.MeshPhysicalMaterial({
    color,
    metalness: 1,
    roughness: rough,
    clearcoat: 0.4,
    envMapIntensity: 1.3,
  });

export const plastic = (color: THREE.ColorRepresentation, rough = 0.32) =>
  new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.05,
    roughness: rough,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });

export const lensMat = (color: THREE.ColorRepresentation, opacity = 0.55) =>
  new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.25,
    roughness: 0.04,
    transparent: true,
    opacity,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

export const mirrorLens = (color: THREE.ColorRepresentation = 0xaab4c8) =>
  new THREE.MeshPhysicalMaterial({
    color,
    metalness: 1,
    roughness: 0.04,
    envMapIntensity: 2.2,
    side: THREE.DoubleSide,
  });

export const gem = (color: THREE.ColorRepresentation) =>
  new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.1,
    roughness: 0.05,
    clearcoat: 1,
    emissive: color,
    emissiveIntensity: 0.28,
    flatShading: true,
    envMapIntensity: 1.6,
  });

export const pearl = () =>
  new THREE.MeshPhysicalMaterial({
    color: 0xf7f1ea,
    metalness: 0.1,
    roughness: 0.25,
    clearcoat: 1,
    sheen: 1,
    sheenColor: new THREE.Color(0xffd6e8),
    envMapIntensity: 1.2,
  });

export const fabric = (color: THREE.ColorRepresentation, rough = 0.9) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: 0,
    side: THREE.DoubleSide,
  });

/* ---------------------------------------------------------------
   Lens / frame outlines
---------------------------------------------------------------- */
export type LensKind =
  | "round"
  | "rounded"
  | "square"
  | "aviator"
  | "cat"
  | "heart"
  | "hex"
  | "star";

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Outline of one lens. For "cat" the outer corner points to +x (mirror it for the other eye). */
export function lensShape(kind: LensKind, w: number, h: number): THREE.Shape {
  switch (kind) {
    case "round": {
      const s = new THREE.Shape();
      s.absellipse(0, 0, w / 2, h / 2, 0, Math.PI * 2, false, 0);
      return s;
    }
    case "rounded":
      return roundedRect(w, h, Math.min(w, h) * 0.3);
    case "square":
      return roundedRect(w, h, Math.min(w, h) * 0.1);
    case "aviator": {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, h * 0.1);
      s.bezierCurveTo(-w / 2, h * 0.55, w / 2, h * 0.55, w / 2, h * 0.1);
      s.bezierCurveTo(w / 2, -h * 0.3, w * 0.2, -h * 0.5, 0, -h * 0.5);
      s.bezierCurveTo(-w * 0.2, -h * 0.5, -w / 2, -h * 0.3, -w / 2, h * 0.1);
      return s;
    }
    case "cat": {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, -h * 0.2);
      s.bezierCurveTo(-w / 2, h * 0.35, -w * 0.1, h * 0.5, w * 0.2, h * 0.45);
      s.bezierCurveTo(w * 0.4, h * 0.45, w / 2, h * 0.6, w / 2, h * 0.62);
      s.bezierCurveTo(w / 2, h * 0.3, w * 0.46, -h * 0.3, w * 0.1, -h * 0.45);
      s.bezierCurveTo(-w * 0.2, -h * 0.55, -w / 2, -h * 0.45, -w / 2, -h * 0.2);
      return s;
    }
    case "heart": {
      const s = new THREE.Shape();
      s.moveTo(0, -h / 2);
      s.bezierCurveTo(-w * 0.6, -h * 0.1, -w * 0.45, h * 0.5, 0, h * 0.2);
      s.bezierCurveTo(w * 0.45, h * 0.5, w * 0.6, -h * 0.1, 0, -h / 2);
      return s;
    }
    case "hex": {
      const s = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = Math.cos(a) * (w / 2);
        const y = Math.sin(a) * (h / 2);
        if (i) s.lineTo(x, y);
        else s.moveTo(x, y);
      }
      s.closePath();
      return s;
    }
    case "star": {
      const s = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? 0.5 : 0.22;
        const x = Math.cos(a) * r * w;
        const y = Math.sin(a) * r * h;
        if (i) s.lineTo(x, y);
        else s.moveTo(x, y);
      }
      s.closePath();
      return s;
    }
  }
}

/* ---------------------------------------------------------------
   Geometry helpers
---------------------------------------------------------------- */
/** A smooth rim (tube) that follows a closed 2D outline. */
export function rimTube(
  shape: THREE.Shape,
  radius: number,
  material: THREE.Material,
  segments = 96,
) {
  const pts = shape
    .getSpacedPoints(segments)
    .map((p) => new THREE.Vector3(p.x, p.y, 0));
  pts.pop(); // last point equals the first
  const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.2);
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(64, segments), radius, 16, true),
    material,
  );
}

/** A flat lens filling a 2D outline. */
export function flatLens(shape: THREE.Shape, material: THREE.Material) {
  return new THREE.Mesh(new THREE.ShapeGeometry(shape, 32), material);
}

/** A smooth tube through 3D points (arms, chains, wires). */
export function tube(
  points: [number, number, number][],
  radius: number,
  material: THREE.Material,
  closed = false,
  segments = 64,
) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    closed,
  );
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(64, segments), radius, 12, closed),
    material,
  );
}

/** A ring (torus) lying in the XY plane. */
export function ring(
  radius: number,
  thickness: number,
  material: THREE.Material,
  arc = Math.PI * 2,
) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius, thickness, 16, 64, arc),
    material,
  );
}

/** Extruded 2D shape with a soft bevel. */
export function extrude(
  shape: THREE.Shape,
  depth: number,
  material: THREE.Material,
  bevel = depth * 0.25,
) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geo.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geo, material);
}

/** Place an object and return it (keeps builder code short). */
export function at<T extends THREE.Object3D>(
  obj: T,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
) {
  obj.position.set(x, y, z);
  obj.rotation.set(rx, ry, rz);
  return obj;
}
