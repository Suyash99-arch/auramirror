import * as THREE from "three";
import { plastic, fabric } from "./common";

const ZC = -1.0; // head centre sits a little behind the anchor (same as headwear)

/* ---------------------------------------------------------------
   Strand texture + hair material
---------------------------------------------------------------- */
function hairTexture(hex: number, curly = false) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = `#${new THREE.Color(hex).getHexString()}`;
  g.fillRect(0, 0, 256, 256);

  if (curly) {
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 1.5 + Math.random() * 3.5;
      g.strokeStyle =
        Math.random() > 0.5
          ? `rgba(255,255,255,${0.04 + Math.random() * 0.08})`
          : `rgba(0,0,0,${0.12 + Math.random() * 0.2})`;
      g.lineWidth = 0.8 + Math.random() * 1.4;
      g.beginPath();
      g.arc(x, y, r, Math.random() * 6, Math.random() * 6 + 3);
      g.stroke();
    }
  } else {
    for (let i = 0; i < 460; i++) {
      const x = Math.random() * 256;
      const light = Math.random() > 0.5;
      g.strokeStyle = light
        ? `rgba(255,255,255,${0.03 + Math.random() * 0.09})`
        : `rgba(0,0,0,${0.05 + Math.random() * 0.12})`;
      g.lineWidth = 0.6 + Math.random() * 1.6;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + (Math.random() - 0.5) * 6, 256);
      g.stroke();
    }
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (curly) t.repeat.set(3, 2);
  return t;
}

function hairMat(hex: number, curly = false) {
  return new THREE.MeshPhysicalMaterial({
    map: hairTexture(hex, curly),
    color: 0xffffff,
    roughness: curly ? 0.85 : 0.42,
    metalness: 0,
    sheen: 1,
    sheenColor: new THREE.Color(hex).offsetHSL(0, 0, 0.25),
    sheenRoughness: 0.4,
    clearcoat: curly ? 0 : 0.15,
    clearcoatRoughness: 0.5,
    envMapIntensity: 0.7,
    side: THREE.DoubleSide,
  });
}

/* ---------------------------------------------------------------
   Shape helpers
---------------------------------------------------------------- */
/** Round scalp cap: a dome whose lower edge sits at height y0. */
function dome(mat: THREE.Material, R = 8.3, H = 8, y0 = 0.3) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R * Math.sin(t), y0 + H * Math.cos(t)));
  }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), mat);
  m.scale.z = 1.06;
  m.position.z = ZC;
  return m;
}

/** Curtain of hair around the head with the front left open (wedge = half opening in radians). */
function curtain(
  profile: [number, number][],
  wedge: number,
  mat: THREE.Material,
) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, 96, wedge, Math.PI * 2 - wedge * 2);
  const m = new THREE.Mesh(geo, mat);
  m.scale.z = 1.06;
  m.position.z = ZC;
  return m;
}

/** A thick lock of hair that tapers towards its end. */
function lock(
  path: [number, number, number][],
  r0: number,
  mat: THREE.Material,
) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(
    path.map((p) => new THREE.Vector3(...p)),
  );
  const n = 32;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = curve.getPoint(t);
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(r0 * (1 - t * 0.7), 18, 14),
      mat,
    );
    s.position.copy(p);
    g.add(s);
  }
  return g;
}

/* ---------------------------------------------------------------
   Styles
---------------------------------------------------------------- */
function bob() {
  const g = new THREE.Group();
  const m = hairMat(0x1c1410);
  g.add(dome(m));
  g.add(
    curtain(
      [
        [8.35, 0.3],
        [8.7, -1.5],
        [9.0, -3.5],
        [9.1, -5.5],
        [8.8, -7.5],
        [8.2, -8.8],
      ],
      0.85,
      m,
    ),
  );
  return g;
}

function longHair() {
  const g = new THREE.Group();
  const m = hairMat(0x5a2a14);
  g.add(dome(m));
  g.add(
    curtain(
      [
        [8.35, 0.3],
        [8.8, -2],
        [9.2, -5],
        [9.5, -9],
        [9.4, -13],
        [8.6, -17],
        [7.2, -19],
      ],
      0.8,
      m,
    ),
  );
  // two front locks falling over the shoulders
  for (const side of [-1, 1]) {
    g.add(
      lock(
        [
          [side * 6.6, 0.6, 5.3],
          [side * 7.1, -4.5, 5.0],
          [side * 7.6, -10, 4.4],
          [side * 7.4, -15.5, 3.8],
        ],
        1.35,
        m,
      ),
    );
  }
  return g;
}

function ponytail() {
  const g = new THREE.Group();
  const m = hairMat(0x2b1a10);
  g.add(dome(m));
  g.add(
    curtain(
      [
        [8.35, 0.3],
        [8.6, -1.2],
        [8.5, -2.8],
      ],
      1.45,
      m,
    ),
  );

  // the tail swings back and then falls down
  const path: [number, number, number][] = [
    [0, 6.6, -9.4],
    [0, 5.2, -12.8],
    [0, 1.2, -15.0],
    [0, -4, -15.2],
    [0, -9, -14.2],
    [0, -14, -13.2],
  ];
  g.add(lock(path, 1.9, m));

  // hair tie
  const tie = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.45, 12, 32),
    plastic(0x7c3aed, 0.3),
  );
  tie.position.set(0, 6.2, -10.1);
  tie.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, -0.4, -1).normalize(),
  );
  g.add(tie);
  return g;
}

function afro() {
  const g = new THREE.Group();
  const m = hairMat(0x120c08, true);
  const cy = 4.5;
  const cz = ZC - 1.8;
  const R = 11.2;

  // upper volume (full circle) leaves the forehead clear
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(R, 56, 40, 0, Math.PI * 2, 0, Math.PI * 0.62),
    m,
  );
  top.position.set(0, cy, cz);
  g.add(top);

  // lower back volume with the front left open
  const w = 0.9;
  const back = new THREE.Mesh(
    new THREE.SphereGeometry(
      R,
      56,
      24,
      Math.PI / 2 + w,
      Math.PI * 2 - w * 2,
      Math.PI * 0.62,
      Math.PI * 0.26,
    ),
    m,
  );
  back.position.set(0, cy, cz);
  g.add(back);
  return g;
}

function bun() {
  const g = new THREE.Group();
  const m = hairMat(0x7a4a20);
  g.add(dome(m));
  g.add(
    curtain(
      [
        [8.35, 0.3],
        [8.6, -1.2],
        [8.45, -2.6],
      ],
      1.35,
      m,
    ),
  );

  // twisted bun
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.5, 1.0, 120, 14, 2, 3),
    m,
  );
  knot.position.set(0, 10.4, ZC - 2.4);
  knot.rotation.set(0.3, 0.4, 0);
  g.add(knot);

  // scrunchie
  const scrunchie = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.7, 14, 36),
    fabric(0xf472b6, 0.7),
  );
  scrunchie.position.set(0, 8.0, ZC - 2.3);
  scrunchie.rotation.x = Math.PI / 2;
  g.add(scrunchie);
  return g;
}

/* ---------------------------------------------------------------
   Registry: accessory id -> builder
---------------------------------------------------------------- */
export const hairBuilders: Record<string, () => THREE.Group> = {
  "hair-bob": bob,
  "hair-long": longHair,
  "hair-ponytail": ponytail,
  "hair-afro": afro,
  "hair-bun": bun,
};
