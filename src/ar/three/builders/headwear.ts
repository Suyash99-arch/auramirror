import * as THREE from "three";
import {
  GOLD,
  SILVER,
  metal,
  plastic,
  fabric,
  gem,
  pearl,
  tube,
  extrude,
} from "./common";

/* Head ellipse used by every hat (units ~ cm, origin = band plane of the hat). */
const RX = 7.9;
const RZ = 8.7;
const ZC = -1.0; // head centre sits a little behind the anchor

const ep = (
  rx: number,
  rz: number,
  y: number,
  t: number,
): [number, number, number] => [rx * Math.sin(t), y, ZC + rz * Math.cos(t)];

/** A closed tube following the head ellipse at height y. */
function eRing(
  rx: number,
  rz: number,
  y: number,
  r: number,
  mat: THREE.Material,
  n = 72,
) {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) pts.push(ep(rx, rz, y, (i / n) * Math.PI * 2));
  return tube(pts, r, mat, true, n);
}

/** Open band (cylinder wall) following the head ellipse. */
function eBand(
  rx: number,
  rz: number,
  h: number,
  y: number,
  mat: THREE.Material,
) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, h, 96, 1, true),
    mat,
  );
  m.scale.set(rx, 1, rz);
  m.position.set(0, y, ZC);
  return m;
}

/** Surface of revolution from a (radius, height) profile, stretched to a head-like oval. */
function lathe(profile: [number, number][], mat: THREE.Material, zs = 1.1) {
  const geo = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    80,
  );
  const m = new THREE.Mesh(geo, mat);
  m.scale.z = zs;
  m.position.z = ZC;
  return m;
}

const dir = (x: number, y: number, z: number) =>
  new THREE.Vector3(x, y, z).normalize();

/* ===============================================================
   CROWN: open golden crown with spikes, pearls and gems
================================================================ */
function crown() {
  const g = new THREE.Group();
  const gold = metal(GOLD, 0.14);
  gold.side = THREE.DoubleSide;
  const stones = [0xe11d48, 0x10b981, 0x3b82f6];

  g.add(eBand(RX, RZ, 1.8, 0.9, gold));
  g.add(eRing(RX, RZ, 0.05, 0.32, gold));
  g.add(eRing(RX, RZ, 1.8, 0.32, gold));

  const N = 9;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const h = i === 0 ? 5.4 : i % 2 ? 3.3 : 4.3;
    const [x, , z] = ep(RX, RZ, 0, t);

    // spike
    const spike = new THREE.Mesh(new THREE.ConeGeometry(1.0, h, 6), gold);
    spike.position.set(x, 1.8 + h / 2, z);
    g.add(spike);

    // tip: pearl on short spikes, gem on tall ones
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(i === 0 ? 0.75 : 0.55, 20, 16),
      i % 2 ? pearl() : gem(stones[i % 3]),
    );
    tip.position.set(x, 1.8 + h + 0.25, z);
    g.add(tip);

    // stone set into the band
    const [bx, , bz] = ep(RX + 0.12, RZ + 0.12, 0, t);
    const stone = new THREE.Mesh(
      new THREE.SphereGeometry(i === 0 ? 0.85 : 0.6, 20, 16),
      gem(stones[(i + 1) % 3]),
    );
    stone.position.set(bx, 0.9, bz);
    stone.scale.set(1, 1, 0.55);
    stone.rotation.y = t;
    g.add(stone);

    // small pearls on the band between spikes
    const [px, , pz] = ep(RX + 0.1, RZ + 0.1, 0, t + Math.PI / N);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), pearl());
    p.position.set(px, 0.9, pz);
    g.add(p);
  }
  return g;
}

/* ===============================================================
   TIARA: silver arc across the front with a central stone
================================================================ */
function tiara() {
  const g = new THREE.Group();
  const silver = metal(SILVER, 0.08);
  const diamond = () =>
    new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      metalness: 0.1,
      roughness: 0.02,
      clearcoat: 1,
      flatShading: true,
      emissive: 0xbae6fd,
      emissiveIntensity: 0.25,
      envMapIntensity: 2,
    });

  const arc: [number, number, number][] = [];
  for (let a = -80; a <= 80; a += 8)
    arc.push(ep(RX * 0.99, RZ * 0.99, 0, (a * Math.PI) / 180));
  g.add(tube(arc, 0.3, silver, false, 60));

  const peaks: [number, number][] = [
    [-64, 1.6],
    [-48, 2.3],
    [-32, 3.1],
    [-16, 4.0],
    [0, 5.6],
    [16, 4.0],
    [32, 3.1],
    [48, 2.3],
    [64, 1.6],
  ];
  for (const [a, h] of peaks) {
    const t = (a * Math.PI) / 180;
    const [x, , z] = ep(RX * 0.99, RZ * 0.99, 0, t);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, h, 6), silver);
    cone.position.set(x, h / 2, z);
    g.add(cone);
    const top = new THREE.Mesh(
      new THREE.OctahedronGeometry(a === 0 ? 0.55 : 0.36),
      diamond(),
    );
    top.position.set(x, h + 0.25, z);
    g.add(top);
  }

  // central stone
  const [cx, , cz] = ep(RX, RZ, 0, 0);
  const big = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 24, 18),
    gem(0xec4899),
  );
  big.position.set(cx, 1.5, cz + 0.3);
  big.scale.set(1, 1.2, 0.6);
  g.add(big);

  // little pearls along the band
  for (let a = -72; a <= 72; a += 12) {
    if (a === 0) continue;
    const [x, , z] = ep(RX * 1.0, RZ * 1.0, 0, (a * Math.PI) / 180);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), pearl());
    p.position.set(x, 0.55, z + 0.15);
    g.add(p);
  }
  return g;
}

/* ===============================================================
   STREET CAP: dome with seams, curved brim, button
================================================================ */
function streetCap() {
  const g = new THREE.Group();
  const cloth = fabric(0x1f2330, 0.85);
  const seam = fabric(0x0f1117, 0.9);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(8.2, 72, 48, 0, Math.PI * 2, 0, Math.PI / 2),
    cloth,
  );
  dome.scale.set(1, 0.9, 1.04);
  dome.position.z = ZC;
  g.add(dome);

  // stitched panel seams
  for (let k = 0; k < 6; k++) {
    const phi = (k * Math.PI) / 3;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * (Math.PI / 2);
      pts.push([
        8.3 * Math.sin(a) * Math.cos(phi),
        8.3 * 0.9 * Math.cos(a),
        ZC + 8.3 * 1.04 * Math.sin(a) * Math.sin(phi),
      ]);
    }
    g.add(tube(pts, 0.07, seam, false, 20));
  }

  const button = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 16, 12),
    plastic(0x7c3aed),
  );
  button.position.set(0, 8.2 * 0.9 + 0.1, ZC);
  g.add(button);

  // brim, curved down slightly
  const s = new THREE.Shape();
  s.moveTo(-6.4, 0);
  s.bezierCurveTo(-6.9, 3.5, -3.8, 6.4, 0, 6.5);
  s.bezierCurveTo(3.8, 6.4, 6.9, 3.5, 6.4, 0);
  s.closePath();
  const brim = extrude(s, 0.45, plastic(0x7c3aed, 0.3), 0.12);
  brim.rotation.x = Math.PI / 2;
  const holder = new THREE.Group();
  holder.add(brim);
  holder.position.set(0, 0.35, ZC + 6.9);
  holder.rotation.x = 0.2;
  g.add(holder);

  // small gold emblem on the front panel
  const emblem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.7),
    metal(GOLD, 0.15),
  );
  emblem.position.set(0, 3.6, ZC + 8.2 * 1.04 * 0.93);
  emblem.scale.set(1, 1.3, 0.4);
  g.add(emblem);
  return g;
}

/* ===============================================================
   FEDORA
================================================================ */
function fedora() {
  const g = new THREE.Group();
  const felt = fabric(0x2a2a30, 0.9);
  g.add(
    lathe(
      [
        [12.8, 1.1],
        [12.2, 0.3],
        [9.5, 0.05],
        [7.7, 0.0],
        [7.55, 2.4],
        [7.4, 5.2],
        [6.7, 6.4],
        [5.2, 6.0],
        [3.4, 5.1],
        [0.01, 5.2],
      ],
      felt,
    ),
  );
  // ribbon band + small bow
  const ribbon = fabric(0xb91c1c, 0.7);
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(7.62, 7.7, 1.5, 64, 1, true),
    ribbon,
  );
  band.scale.z = 1.1;
  band.position.set(0, 1.3, ZC);
  g.add(band);
  const bow = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), ribbon);
  bow.position.set(2.2, 1.3, ZC + 8.4);
  bow.scale.set(1.5, 0.8, 0.6);
  g.add(bow);
  return g;
}

/* ===============================================================
   COWBOY HAT
================================================================ */
function cowboy() {
  const g = new THREE.Group();
  const leather = fabric(0x8a5a2b, 0.85);
  g.add(
    lathe(
      [
        [15.2, 3.4],
        [13.6, 1.1],
        [10.5, 0.25],
        [7.7, 0.0],
        [7.6, 2.0],
        [7.2, 6.2],
        [6.2, 7.5],
        [4.6, 7.1],
        [3.0, 5.8],
        [0.01, 5.6],
      ],
      leather,
    ),
  );
  g.add(eRing(7.75, 8.55, 1.3, 0.55, fabric(0x3b2412, 0.8)));
  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.3, 0.3),
    metal(GOLD, 0.15),
  );
  buckle.position.set(0, 1.3, ZC + 9.05);
  g.add(buckle);
  return g;
}

/* ===============================================================
   BEANIE: dome, ribbed cuff, pom-pom
================================================================ */
function beanie() {
  const g = new THREE.Group();
  const knit = fabric(0xe11d48, 1);
  const dark = fabric(0xbe123c, 1);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(8.4, 64, 48, 0, Math.PI * 2, 0, Math.PI / 2),
    knit,
  );
  dome.scale.set(1, 1.05, 1.06);
  dome.position.set(0, 0.9, ZC);
  g.add(dome);

  const cuff = new THREE.Mesh(
    new THREE.CylinderGeometry(8.7, 8.7, 3.2, 56, 1, true),
    dark,
  );
  cuff.scale.z = 1.06;
  cuff.position.set(0, 0, ZC);
  g.add(cuff);
  for (const y of [-1.2, -0.4, 0.4, 1.2])
    g.add(eRing(8.75, 9.3, y, 0.2, fabric(0x9f1239, 1)));

  const pom = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 24, 18),
    fabric(0xfda4af, 1),
  );
  pom.position.set(0, 0.9 + 8.4 * 1.05 + 1.2, ZC);
  g.add(pom);
  return g;
}

/* ===============================================================
   WIZARD HAT: bent cone, wide brim, gold star
================================================================ */
function wizard() {
  const g = new THREE.Group();
  const felt = fabric(0x312e81, 0.95);
  g.add(
    lathe(
      [
        [13.2, 0.9],
        [12.6, 0.2],
        [8.2, 0.0],
        [0.01, 0.0],
      ],
      felt,
    ),
  );

  // crown cone built from tilted segments so the tip bends
  const radii = [7.4, 5.5, 3.3, 0.2];
  const hs = [5, 5, 5];
  let parent: THREE.Object3D = g;
  let first = true;
  for (let i = 0; i < hs.length; i++) {
    const holder = new THREE.Group();
    holder.position.set(0, first ? 0 : hs[i - 1], first ? ZC : 0);
    holder.rotation.z = i === 0 ? 0 : 0.17;
    parent.add(holder);
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(radii[i + 1], radii[i], hs[i], 40, 1, true),
      felt,
    );
    seg.position.y = hs[i] / 2;
    holder.add(seg);
    parent = holder;
    first = false;
  }

  g.add(eRing(7.5, 8.2, 1.2, 0.5, metal(GOLD, 0.2)));

  // gold star on the front
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 1.1 : 0.48;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i) star.lineTo(x, y);
    else star.moveTo(x, y);
  }
  star.closePath();
  const starMesh = extrude(star, 0.15, metal(GOLD, 0.15), 0.05);
  starMesh.position.set(0, 4.6, ZC + 6.3);
  g.add(starMesh);
  return g;
}

/* ===============================================================
   PARTY HAT: striped cone with gold pom-pom
================================================================ */
function party() {
  const g = new THREE.Group();
  const cols = [0xf43f5e, 0xfacc15];
  const segs = 6;
  const H = 12;
  const R = 4.6;
  const h = H / segs;
  for (let i = 0; i < segs; i++) {
    const r0 = R * (1 - i / segs);
    const r1 = R * (1 - (i + 1) / segs);
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(Math.max(r1, 0.001), r0, h, 36, 1, false),
      fabric(cols[i % 2], 0.6),
    );
    m.position.y = h * i + h / 2;
    g.add(m);
  }
  const pom = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 16, 12),
    metal(GOLD, 0.25),
  );
  pom.position.y = H + 0.4;
  g.add(pom);
  g.position.set(0, 0, ZC - 0.2);
  g.rotation.set(-0.12, 0, 0.1);
  const wrap = new THREE.Group();
  wrap.add(g);
  return wrap;
}

/* ===============================================================
   BUCKET HAT
================================================================ */
function bucket() {
  const g = new THREE.Group();
  const cloth = fabric(0xd6c7a1, 0.95);
  g.add(
    lathe(
      [
        [0.01, 5.4],
        [5.7, 5.4],
        [6.2, 5.0],
        [7.7, 0.7],
        [7.8, 0.2],
        [10.2, -0.7],
        [11.6, -1.9],
      ],
      cloth,
    ),
  );
  g.add(eRing(7.85, 8.65, 0.9, 0.3, fabric(0x92400e, 0.9)));
  return g;
}

/* ===============================================================
   FLOWER CROWN: green vine with real flowers
================================================================ */
function flower(color: number, size: number) {
  const f = new THREE.Group();
  const petalMat = fabric(color, 0.55);
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i / 6) * Math.PI * 2;
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(size * 0.55, 14, 10),
      petalMat,
    );
    p.position.x = size * 0.62;
    p.scale.set(1.2, 0.85, 0.4);
    pivot.add(p);
    f.add(pivot);
  }
  const centre = new THREE.Mesh(
    new THREE.SphereGeometry(size * 0.36, 14, 10),
    plastic(0xf59e0b, 0.5),
  );
  centre.position.z = size * 0.12;
  f.add(centre);
  return f;
}

function flowerCrown() {
  const g = new THREE.Group();
  const vine = fabric(0x2f7d32, 0.8);
  g.add(eRing(RX + 0.1, RZ + 0.1, 0.2, 0.32, vine));

  const palette = [0xf9a8d4, 0xffffff, 0xfde68a, 0xc4b5fd, 0xfda4af, 0xfb923c];
  const N = 13;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const [x, y, z] = ep(RX + 0.2, RZ + 0.2, 0.25, t);
    const f = flower(palette[i % palette.length], i % 3 === 0 ? 1.7 : 1.25);
    f.position.set(x, y, z);
    f.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      dir(Math.sin(t), 0.7, Math.cos(t)),
    );
    g.add(f);

    // leaf between flowers
    const [lx, ly, lz] = ep(RX + 0.15, RZ + 0.15, 0.1, t + Math.PI / N);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), vine);
    leaf.position.set(lx, ly, lz);
    leaf.scale.set(1.5, 0.35, 0.8);
    leaf.rotation.y = t + Math.PI / N;
    g.add(leaf);
  }
  return g;
}

/* ===============================================================
   Registry: accessory id -> builder
================================================================ */
export const headwearBuilders: Record<string, () => THREE.Group> = {
  cap: streetCap,
  fedora,
  crown,
  beanie,
  cowboy,
  "wizard-hat": wizard,
  "party-hat": party,
  "bucket-hat": bucket,
  "flower-crown": flowerCrown,
  tiara,
};
