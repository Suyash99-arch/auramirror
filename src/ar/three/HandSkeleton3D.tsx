import { memo, useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { handBus } from "../handBus";

// which joints connect to which (MediaPipe hand model)
const BONES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // index
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12], // middle
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16], // ring
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20], // pinky
  [0, 17], // palm edge
];
const TIPS = [4, 8, 12, 16, 20];
const COLORS = [0x22d3ee, 0xa78bfa]; // hand 1 cyan, hand 2 violet
const PINK = 0xf472b6;

type Props = { ready: boolean; videoRef: RefObject<HTMLVideoElement | null> };

type Rig = {
  group: THREE.Group;
  joints: THREE.Mesh[];
  bones: THREE.Mesh[];
  mats: THREE.MeshBasicMaterial[];
  opacity: number;
};

export default memo(function HandSkeleton3D({ ready, videoRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    // pixel-space camera: 1 unit = 1 css pixel
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -3000, 3000);

    const sphereGeo = new THREE.SphereGeometry(1, 16, 12);
    const boneGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1);

    const makeRig = (hex: number): Rig => {
      const group = new THREE.Group();
      const mats: THREE.MeshBasicMaterial[] = [];
      const newMat = () => {
        const m = new THREE.MeshBasicMaterial({
          color: hex,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        mats.push(m);
        return m;
      };
      const joints = Array.from({ length: 21 }, () => {
        const m = new THREE.Mesh(sphereGeo, newMat());
        group.add(m);
        return m;
      });
      const bones = BONES.map(() => {
        const m = new THREE.Mesh(boneGeo, newMat());
        group.add(m);
        return m;
      });
      group.visible = false;
      scene.add(group);
      return { group, joints, bones, mats, opacity: 0 };
    };
    const rigs = [makeRig(COLORS[0]), makeRig(COLORS[1])];

    const up = new THREE.Vector3(0, 1, 0);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const col = new THREE.Color();
    let raf = 0;
    let lastW = 0;
    let lastH = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);

      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      if (w !== lastW || h !== lastH) {
        lastW = w;
        lastH = h;
        renderer.setSize(w, h, false);
        camera.right = w;
        camera.top = h;
        camera.updateProjectionMatrix();
      }

      const video = videoRef.current;
      const vw = video?.videoWidth ?? 0;
      const vh = video?.videoHeight ?? 0;
      const fresh = performance.now() - handBus.t < 200;

      // same crop maths as object-fit: cover
      const s = vw && vh ? Math.max(w / vw, h / vh) : 1;
      const offX = (w - vw * s) / 2;
      const offY = (h - vh * s) / 2;

      rigs.forEach((rig, idx) => {
        const lm = fresh && vw ? handBus.hands[idx] : undefined;
        rig.opacity += ((lm ? 1 : 0) - rig.opacity) * 0.25; // smooth fade in/out
        rig.group.visible = rig.opacity > 0.02;
        rig.mats.forEach((m) => (m.opacity = rig.opacity * 0.9));
        if (!lm) return;

        // pinch = thumb tip close to index tip, relative to hand size
        const size = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) || 0.1;
        const pinch =
          Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) / size < 0.35;
        col.set(pinch ? PINK : COLORS[idx]);
        rig.mats.forEach((m) => m.color.copy(col));

        const pts = lm.map((p) => {
          const x = offX + p.x * vw * s;
          const y = h - (offY + p.y * vh * s); // three.js y points up
          const z = -p.z * vw * s; // closer to camera = bigger z
          const depth = Math.min(2.2, Math.max(0.6, 1 - p.z * 4));
          return { x, y, z, depth };
        });

        pts.forEach((p, i) => {
          const isTip = TIPS.includes(i);
          const r =
            (isTip ? 7 : 4.5) *
            p.depth *
            (pinch && (i === 4 || i === 8) ? 1.6 : 1);
          rig.joints[i].position.set(p.x, p.y, p.z);
          rig.joints[i].scale.setScalar(r);
        });

        BONES.forEach(([i, j], k) => {
          a.set(pts[i].x, pts[i].y, pts[i].z);
          b.set(pts[j].x, pts[j].y, pts[j].z);
          dir.subVectors(b, a);
          const len = dir.length() || 0.001;
          const bone = rig.bones[k];
          bone.position.copy(a).addScaledVector(dir, 0.5);
          bone.quaternion.setFromUnitVectors(up, dir.normalize());
          const r = 2.2 * ((pts[i].depth + pts[j].depth) / 2);
          bone.scale.set(r, len, r);
        });
      });

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      sphereGeo.dispose();
      boneGeo.dispose();
      rigs.forEach((r) => r.mats.forEach((m) => m.dispose()));
      renderer.dispose();
    };
  }, [ready, videoRef]);

  return <canvas ref={canvasRef} className="hand-layer" />;
});
