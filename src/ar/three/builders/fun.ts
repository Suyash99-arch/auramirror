import * as THREE from "three";
import { GOLD, metal, plastic, fabric, tube, extrude } from "./common";

const ZC = -1.0; // head centre sits a little behind the anchor (same as the other builders)

/* ---------------------------------------------------------------
   Helpers
---------------------------------------------------------------- */
/** A thin band arcing over the head from ear to ear. */
function headband(mat: THREE.Material) {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 22; i++) {
    const a = (i / 22) * Math.PI;
    pts.push([8.0 * Math.cos(a), 7.2 * Math.sin(a), ZC + 0.4]);
  }
  return tube(pts, 0.32, mat, false, 48);
}

/** y of the head arc at a given x (for placing things on the band). */
const arcY = (x: number) => 7.2 * Math.sqrt(Math.max(0, 1 - (x / 8.0) ** 2));

/** Smooth tapering horn / spike that follows a path. */
function taper(
  path: [number, number, number][],
  r0: number,
  r1: number,
  mat: THREE.Material,
  n = 40,
) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(
    path.map((p) => new THREE.Vector3(...p)),
  );
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    const a = curve.getPoint(t0);
    const b = curve.getPoint(t1);
    const len = a.distanceTo(b);
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(
        r0 + (r1 - r0) * t1,
        r0 + (r1 - r0) * t0,
        len * 1.05,
        20,
        1,
        false,
      ),
      mat,
    );
    seg.position.copy(a).add(b).multiplyScalar(0.5);
    seg.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
    g.add(seg);
  }
  // rounded base
  const base = new THREE.Mesh(new THREE.SphereGeometry(r0, 24, 16), mat);
  base.position.copy(curve.getPoint(0));
  g.add(base);
  return g;
}

/* ===============================================================
   CAT EARS
================================================================ */
function catEars() {
  const g = new THREE.Group();
  const black = plastic(0x15151b, 0.35);
  const fur = fabric(0x1a1a22, 0.95);
  const pink = fabric(0xf9a8d4, 0.8);

  g.add(headband(black));

  for (const s of [1, -1]) {
    const x = s * 4.6;
    const pivot = new THREE.Group();
    pivot.position.set(x, arcY(x) - 0.2, ZC + 0.4);
    pivot.rotation.z = -s * 0.32; // lean outwards
    pivot.rotation.x = -0.12; // lean slightly forward

    const outer = new THREE.Mesh(new THREE.ConeGeometry(2.1, 4.6, 40), fur);
    outer.position.y = 2.3;
    outer.scale.z = 0.5;
    pivot.add(outer);

    const innerEar = new THREE.Mesh(
      new THREE.ConeGeometry(1.35, 3.3, 40),
      pink,
    );
    innerEar.position.set(0, 1.9, 0.38);
    innerEar.scale.z = 0.3;
    pivot.add(innerEar);

    g.add(pivot);
  }
  return g;
}

/* ===============================================================
   BUNNY EARS
================================================================ */
function bunnyEars() {
  const g = new THREE.Group();
  const white = plastic(0xf3f4f6, 0.4);
  const fur = fabric(0xf5f5f7, 0.95);
  const pink = fabric(0xfbb6ce, 0.8);

  g.add(headband(white));

  for (const s of [1, -1]) {
    const x = s * 3.4;
    const pivot = new THREE.Group();
    pivot.position.set(x, arcY(x) - 0.3, ZC + 0.4);
    // the right-hand ear flops forward a little
    pivot.rotation.z = -s * (s === 1 ? 0.3 : 0.18);
    pivot.rotation.x = s === 1 ? -0.18 : -0.05;

    const outer = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), fur);
    outer.scale.set(1.5, 5.4, 0.55);
    outer.position.y = 5.1;
    pivot.add(outer);

    const inside = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), pink);
    inside.scale.set(0.82, 4.3, 0.3);
    inside.position.set(0, 5.0, 0.4);
    pivot.add(inside);

    g.add(pivot);
  }
  return g;
}

/* ===============================================================
   DEVIL HORNS
================================================================ */
function devilHorns() {
  const g = new THREE.Group();
  const red = plastic(0xb91c1c, 0.16);

  for (const s of [1, -1]) {
    g.add(
      taper(
        [
          [s * 4.0, 5.6, ZC + 1.0],
          [s * 4.9, 8.2, ZC + 1.2],
          [s * 5.2, 10.8, ZC + 1.6],
          [s * 4.3, 13.2, ZC + 2.0],
        ],
        1.05,
        0.06,
        red,
        30,
      ),
    );
  }
  return g;
}

/* ===============================================================
   HALO
================================================================ */
function halo() {
  const g = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.TorusGeometry(5.2, 0.42, 20, 72),
    new THREE.MeshPhysicalMaterial({
      color: GOLD,
      emissive: 0xffd54a,
      emissiveIntensity: 1.1,
      metalness: 0.9,
      roughness: 0.2,
      clearcoat: 1,
    }),
  );
  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(5.2, 1.1, 16, 72),
    new THREE.MeshBasicMaterial({
      color: 0xffe89a,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
  );
  g.add(core, glow);
  g.rotation.x = Math.PI / 2 - 0.12; // lie flat, tilted slightly
  g.position.set(0, 15.5, ZC);

  const wrap = new THREE.Group();
  wrap.add(g);
  return wrap;
}

function clownNose() {
  const group = new THREE.Group();
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 24, 18),
    plastic(0xe5344b, 0.2),
  );
  nose.scale.set(1, 0.88, 0.7);
  group.add(nose);
  return group;
}

function piratePatch() {
  const group = new THREE.Group();
  const strap = fabric(0x17151a, 0.9);
  group.add(
    tube(
      [
        [-6, 1.6, 0.2],
        [-3.5, 1.8, 0.35],
        [0, 1.65, 0.25],
        [3.5, 1.8, 0.35],
        [6, 1.6, 0.2],
      ],
      0.16,
      strap,
    ),
  );
  const patch = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 18),
    plastic(0x08090c, 0.55),
  );
  patch.position.set(-2.15, 1.6, 0.48);
  patch.scale.set(1.28, 0.92, 0.25);
  group.add(patch);
  return group;
}

function pilotGoggles() {
  const group = new THREE.Group();
  const rim = metal(GOLD, 0.16);
  const lens = new THREE.MeshPhysicalMaterial({
    color: 0x6b9ba0,
    roughness: 0.12,
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide,
  });
  for (const side of [-1, 1]) {
    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(1.48, 0.2, 12, 40),
      rim,
    );
    frame.position.set(side * 1.75, 0, 0.25);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(1.28, 32), lens);
    glass.position.set(side * 1.75, 0, 0.22);
    group.add(frame, glass);
  }
  group.add(
    tube(
      [
        [-0.3, 0.2, 0.3],
        [0, 0.35, 0.45],
        [0.3, 0.2, 0.3],
      ],
      0.16,
      rim,
    ),
  );
  group.add(headband(fabric(0x342b20, 0.7)));
  return group;
}

function headphones() {
  const group = new THREE.Group();
  const band = metal(0x333b4a, 0.24);
  const cup = plastic(0x1d2430, 0.28);
  group.add(headband(band));
  for (const side of [-1, 1]) {
    const outer = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), cup);
    outer.position.set(side * 7.8, 0.2, ZC + 0.6);
    outer.scale.set(0.95, 1.5, 0.7);
    const cushion = new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.22, 16, 48),
      fabric(0x727d8e, 0.8),
    );
    cushion.position.set(side * 7.8, 0.2, ZC + 1.15);
    group.add(outer, cushion);
  }
  return group;
}

function bandana() {
  const group = new THREE.Group();
  const cloth = fabric(0x9b2335, 0.9);
  const panel = new THREE.Shape();
  panel.moveTo(-5.2, -0.5);
  panel.quadraticCurveTo(0, 0.4, 5.2, -0.5);
  panel.lineTo(4.8, -2.0);
  panel.quadraticCurveTo(0, -1.0, -4.8, -2.0);
  panel.closePath();
  group.add(new THREE.Mesh(new THREE.ShapeGeometry(panel, 20), cloth));
  group.add(
    tube(
      [
        [4.7, -0.8, 0],
        [6.3, -0.5, -0.3],
        [7.2, -1.2, -0.5],
      ],
      0.22,
      cloth,
    ),
  );
  group.add(
    tube(
      [
        [4.8, -1.1, 0],
        [6.0, -2.4, -0.3],
        [6.2, -3.4, -0.5],
      ],
      0.18,
      cloth,
    ),
  );
  return group;
}

/* ===============================================================
   MUSTACHE (origin = centre of the philtrum, between nose and lip)
================================================================ */
function mustache() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.45);
  // right half
  s.bezierCurveTo(1.0, 1.15, 2.8, 1.05, 3.9, 0.5);
  s.bezierCurveTo(4.6, 0.2, 5.0, 0.9, 4.8, 1.7); // curled tip
  s.bezierCurveTo(4.35, 1.0, 4.1, -0.35, 3.3, -0.25);
  s.bezierCurveTo(2.2, -0.8, 1.0, -0.7, 0, -0.35);
  // left half (mirrored)
  s.bezierCurveTo(-1.0, -0.7, -2.2, -0.8, -3.3, -0.25);
  s.bezierCurveTo(-4.1, -0.35, -4.35, 1.0, -4.8, 1.7);
  s.bezierCurveTo(-5.0, 0.9, -4.6, 0.2, -3.9, 0.5);
  s.bezierCurveTo(-2.8, 1.05, -1.0, 1.15, 0, 0.45);

  const m = extrude(s, 0.6, fabric(0x2a1a10, 0.95), 0.14);
  const g = new THREE.Group();
  g.add(m);
  g.scale.setScalar(0.72);
  return g;
}

/* ---------------------------------------------------------------
   Registry: accessory id -> builder
---------------------------------------------------------------- */
export const funBuilders: Record<string, () => THREE.Group> = {
  "cat-ears": catEars,
  "bunny-ears": bunnyEars,
  "devil-horns": devilHorns,
  halo,
  mustache,
  "clown-nose": clownNose,
  "pirate-patch": piratePatch,
  "pilot-goggles": pilotGoggles,
  headphones,
  bandana,
};
