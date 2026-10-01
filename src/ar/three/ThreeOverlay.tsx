import { memo, useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { faceBus } from "../faceBus";
import { accessories } from "../../data/accessories";
import {
  ANCHORS,
  build3D,
  DEBUG_ANCHORS,
  disposeObject,
  OCCLUDER,
} from "./models";

type Props = {
  worn: string[];
  ready: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
};

const clamp = THREE.MathUtils.clamp;

export default memo(function ThreeOverlay({ worn, ready }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wornRef = useRef(worn);
  wornRef.current = worn;

  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const canvas = canvasRef.current;

    /* ---------- renderer ---------- */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true, // lets the photo capture read this canvas
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(63, 1, 0.1, 1000);

    /* ---------- reflections ---------- */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    const envTex = pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = envTex;

    /* ---------- lights ---------- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(0.5, 1, 1);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbcd0ff, 0.6);
    fill.position.set(-1, 0.2, 0.8);
    scene.add(fill);

    /* ---------- head anchor ---------- */
    const head = new THREE.Group();
    head.matrixAutoUpdate = false;
    head.visible = false;
    scene.add(head);

    const debugGeometry = DEBUG_ANCHORS
      ? new THREE.SphereGeometry(0.22, 16, 12)
      : null;
    const debugMaterial = DEBUG_ANCHORS
      ? new THREE.MeshBasicMaterial({ color: 0xff2020 })
      : null;
    if (debugGeometry && debugMaterial) {
      for (const anchor of Object.values(ANCHORS)) {
        const marker = new THREE.Mesh(debugGeometry, debugMaterial);
        marker.position.set(...anchor.pos);
        head.add(marker);
      }
    }

    let occ: THREE.Mesh | null = null;
    if (OCCLUDER) {
      occ = new THREE.Mesh(
        new THREE.SphereGeometry(7, 32, 24),
        new THREE.MeshBasicMaterial({ colorWrite: false }),
      );
      occ.position.set(0, 0, -2);
      occ.scale.set(1, 1.15, 1);
      occ.renderOrder = -1;
      head.add(occ);
    }

    const items = new Map<string, THREE.Object3D>();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const sc = new THREE.Vector3(1, 1, 1);
    const tp = new THREE.Vector3();
    const tq = new THREE.Quaternion();
    const ts = new THREE.Vector3();
    const tmp = new THREE.Matrix4();
    let init = false;
    let lastFaceT = 0;
    let raf = 0;

    /* ---------- resize ---------- */
    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    /* ---------- main loop ---------- */
    const loop = () => {
      raf = requestAnimationFrame(loop);

      // remove items that were taken off
      const want = new Set(wornRef.current);
      for (const [id, obj] of items) {
        if (!want.has(id)) {
          head.remove(obj);
          disposeObject(obj);
          items.delete(id);
        }
      }
      // add newly worn items
      for (const id of want) {
        if (items.has(id)) continue;
        const a = accessories.find((x) => x.id === id);
        const obj = a && build3D(a);
        if (obj) {
          obj.scale.setScalar(0.001);
          head.add(obj);
          items.set(id, obj);
        }
      }
      // pop-in animation
      for (const obj of items.values()) {
        obj.userData.pop = Math.min(1, obj.userData.pop + 0.08);
        const e = 1 - Math.pow(1 - obj.userData.pop, 3);
        obj.scale.setScalar(Math.max(e, 0.001));
      }

      // head pose from MediaPipe, with adaptive smoothing
      const m = faceBus.result?.facialTransformationMatrixes?.[0];
      const age = performance.now() - faceBus.t;
      if (m && age < 500) {
        // only recompute when a new detection arrived
        if (faceBus.t !== lastFaceT) {
          lastFaceT = faceBus.t;
          tmp.fromArray(m.data as unknown as number[]);
          tmp.decompose(tp, tq, ts);
          if (!init) {
            pos.copy(tp);
            quat.copy(tq);
            sc.copy(ts);
            init = true;
          } else {
            // slow when still (no shake), fast when moving (no lag)
            const aPos = clamp(0.15 + pos.distanceTo(tp) * 0.25, 0.15, 0.85);
            const aRot = clamp(0.12 + quat.angleTo(tq) * 6, 0.12, 0.85);
            pos.lerp(tp, aPos);
            quat.slerp(tq, aRot);
            sc.lerp(ts, 0.15);
          }
        }
        head.matrix.compose(pos, quat, sc);
        head.matrixWorldNeedsUpdate = true;
        head.visible = true;
      } else {
        head.visible = false;
        init = false;
      }

      renderer.render(scene, camera);
    };
    loop();

    /* ---------- cleanup ---------- */
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      for (const obj of items.values()) {
        head.remove(obj);
        disposeObject(obj);
      }
      items.clear();
      if (occ) {
        occ.geometry.dispose();
        (occ.material as THREE.Material).dispose();
      }
      envScene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mt = mesh.material as
          | THREE.Material
          | THREE.Material[]
          | undefined;
        if (mt) (Array.isArray(mt) ? mt : [mt]).forEach((x) => x.dispose());
      });
      envTex.dispose();
      pmrem.dispose();
      debugGeometry?.dispose();
      debugMaterial?.dispose();
      renderer.dispose();
    };
  }, [ready]);

  return <canvas ref={canvasRef} className="three-layer" />;
});
