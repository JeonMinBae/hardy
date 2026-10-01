"use client";

import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState, type Ref } from "react";
import {
  AmbientLight,
  BoxGeometry,
  DirectionalLight,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createStage, isWebGLAvailable, readCssColor, watchColorScheme } from "@/components/three/stage";
import { tween } from "@/components/three/tween";
import { layerOf, rotateVec, solvedCube, type CubeSize, type Move, type Vec3 } from "@/lib/cube/cube";
import { dragMove } from "@/lib/cube/drag";

export interface CubeViewHandle {
  turn(move: Move, ms: number): Promise<void>;
  spin(ms: number): Promise<void>;
}

interface Props {
  size: CubeSize;
  /** 마운트 때 애니메이션 없이 적용할 회전(섞기 + 진행) */
  initialMoves: readonly Move[];
  interactive: boolean;
  onDragMove: (move: Move) => void;
  ref: Ref<CubeViewHandle>;
}

const DRAG_THRESHOLD_PX = 10;
const STICKER_VARS = ["--cube-u", "--cube-r", "--cube-f", "--cube-d", "--cube-l", "--cube-b"] as const;
// 조각 간격 2 를 월드 1 로 맞춘다
const UNIT = 0.5;
// 큐브 한 변이 size 일 때 수직 화각 35° 에서 대각 시점의 윤곽이 화면의 약 70% 를 채우는 거리 배수
const DISTANCE_PER_SIZE = 3.9;

// 회전 후 부동소수 오차가 쌓이지 않게 회전 성분을 -1·0·1 로 되돌린다
function snapRotation(object: Object3D) {
  const m = new Matrix4().makeRotationFromQuaternion(object.quaternion);
  m.elements.forEach((v, i) => (m.elements[i] = Math.round(v)));
  object.quaternion.setFromRotationMatrix(m);
  object.position.set(Math.round(object.position.x * 2) / 2, Math.round(object.position.y * 2) / 2, Math.round(object.position.z * 2) / 2);
}

/** 법선에 수직인 축 방향 4개 중 화면에서 드래그 방향과 가장 가까운 것 */
function pickTangent(normal: Vec3, hitPoint: Vector3, drag: Vector2, camera: PerspectiveCamera, canvas: HTMLCanvasElement): Vec3 {
  const toScreen = (p: Vector3) => {
    const v = p.clone().project(camera);
    return new Vector2((v.x * canvas.clientWidth) / 2, (-v.y * canvas.clientHeight) / 2);
  };
  const origin = toScreen(hitPoint);
  const candidates: Vec3[] = [];
  for (let axis = 0; axis < 3; axis++) {
    if (normal[axis] !== 0) continue;
    for (const sign of [1, -1]) candidates.push([0, 1, 2].map((i) => (i === axis ? sign : 0)) as unknown as Vec3);
  }
  const dir = drag.clone().normalize();
  const score = (t: Vec3) =>
    toScreen(hitPoint.clone().add(new Vector3(...t).multiplyScalar(UNIT)))
      .sub(origin)
      .normalize()
      .dot(dir);
  return candidates.reduce((best, t) => (score(t) > score(best) ? t : best));
}

interface Picked {
  normal: Vec3;
  cubie: Vec3;
  point: Vector3;
}

/** picked 가 null 이면 회전 애니메이션 중에 시작돼 멈춘 뒤 start 위치로 다시 고른다 */
interface Gesture {
  start: Vector2;
  ndc: Vector2;
  picked: Picked | null;
  fired: boolean;
}

export default function CubeView({ size, initialMoves, interactive, onDragMove, ref }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [webgl] = useState(() => typeof window === "undefined" || isWebGLAvailable());
  const [failed, setFailed] = useState(false);
  const supported = webgl && !failed;
  const api = useRef<CubeViewHandle | null>(null);
  useImperativeHandle(ref, () => ({
    turn: (move, ms) => api.current?.turn(move, ms) ?? Promise.resolve(),
    spin: (ms) => api.current?.spin(ms) ?? Promise.resolve(),
  }));
  // 효과 안에서 최신 props 를 읽는다. 마운트 effect 를 다시 돌리지 않기 위해서다
  const isInteractive = useEffectEvent(() => interactive);
  const emitDragMove = useEffectEvent((move: Move) => onDragMove(move));
  const getInitialMoves = useEffectEvent(() => initialMoves);

  useEffect(() => {
    if (!webgl || !container.current) return;
    const el = container.current;
    let stage: ReturnType<typeof createStage>;
    try {
      stage = createStage(el);
    } catch {
      // 컨텍스트 생성 실패(자원 부족 등)는 미지원 화면으로 대신한다
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 렌더러는 마운트 뒤에만 만들 수 있다
      setFailed(true);
      return;
    }
    const { scene, camera, renderer } = stage;
    const canvas = renderer.domElement;
    let disposed = false;

    camera.position
      .set(1, 0.85, 1.25)
      .normalize()
      .multiplyScalar(size * DISTANCE_PER_SIZE);
    camera.lookAt(0, 0, 0);
    scene.add(new AmbientLight(0xffffff, 0.9));
    const sun = new DirectionalLight(0xffffff, 1.2);
    sun.position.set(3, 5, 4);
    scene.add(sun);

    const bodyMaterial = new MeshStandardMaterial();
    const stickerMaterials = STICKER_VARS.map(() => new MeshStandardMaterial());
    const applyColors = () => {
      bodyMaterial.color.copy(readCssColor(el, "--cube-body"));
      STICKER_VARS.forEach((name, i) => stickerMaterials[i].color.copy(readCssColor(el, name)));
    };
    applyColors();
    const unwatchScheme = watchColorScheme(applyColors);

    const bodyGeometry = new BoxGeometry(0.96, 0.96, 0.96);
    const stickerGeometry = new PlaneGeometry(0.82, 0.82);
    const root = new Group();
    scene.add(root);

    const cubieByPos = new Map<string, Group>();
    const forward = new Vector3(0, 0, 1);
    for (const { pos, normal, color } of solvedCube(size).stickers) {
      const key = pos.join(",");
      let cubie = cubieByPos.get(key);
      if (!cubie) {
        cubie = new Group();
        cubie.position.set(pos[0] * UNIT, pos[1] * UNIT, pos[2] * UNIT);
        cubie.userData.pos = pos;
        cubie.add(new Mesh(bodyGeometry, bodyMaterial));
        root.add(cubie);
        cubieByPos.set(key, cubie);
      }
      const sticker = new Mesh(stickerGeometry, stickerMaterials[color]);
      const n = new Vector3(...normal);
      sticker.position.copy(n).multiplyScalar(0.485);
      sticker.quaternion.setFromUnitVectors(forward, n);
      sticker.userData.sticker = true;
      cubie.add(sticker);
    }
    const cubies = [...cubieByPos.values()];
    const stickers = cubies.flatMap((c) => c.children.filter((o) => o.userData.sticker));

    const controls = new OrbitControls(camera, canvas);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    controls.update();

    const turn = async (move: Move, ms: number) => {
      const pivot = new Group();
      root.add(pivot);
      const layer = cubies.filter((c) => layerOf(c.userData.pos[move.axis], size) === move.layer);
      layer.forEach((c) => pivot.attach(c));
      const axis = new Vector3(...([0, 1, 2].map((i) => (i === move.axis ? 1 : 0)) as unknown as Vec3));
      await tween(ms, (t) => pivot.setRotationFromAxisAngle(axis, (move.turns * Math.PI * t) / 2));
      layer.forEach((c) => {
        root.attach(c);
        snapRotation(c);
        c.userData.pos = rotateVec(c.userData.pos, move.axis, move.turns);
      });
      root.remove(pivot);
    };

    const spin = async (ms: number) => {
      if (ms <= 0) return;
      const start = camera.position.clone();
      const up = new Vector3(0, 1, 0);
      await tween(ms, (t) => {
        camera.position.copy(start).applyAxisAngle(up, Math.PI * 2 * t);
        controls.update();
      });
      camera.position.copy(start);
      controls.update();
    };

    // 초기 회전이 끝나기 전에 들어온 turn·spin 은 그 뒤로 미룬다
    const ready = (async () => {
      for (const move of getInitialMoves()) {
        if (disposed) return;
        await turn(move, 0);
      }
    })();
    // 진행 중인 애니메이션(이어 붙은 것 포함). 드래그가 움직이는 조각을 집지 않게 멈출 때까지 기다리는 데 쓴다
    let running = 0;
    let settled: Promise<void> = Promise.resolve();
    const track = (run: () => Promise<void>) => {
      running++;
      const p = run().finally(() => running--);
      settled = settled.then(() => p).catch(() => {});
      return p;
    };
    const waitSettled = async () => {
      do await settled;
      while (running > 0);
    };
    api.current = {
      turn: (move, ms) =>
        track(async () => {
          await ready;
          if (!disposed) await turn(move, ms);
        }),
      spin: (ms) =>
        track(async () => {
          await ready;
          if (!disposed) await spin(ms);
        }),
    };

    const raycaster = new Raycaster();
    let gesture: Gesture | null = null;

    const reset = () => {
      gesture = null;
      controls.enabled = true;
    };

    const pick = (ndc: Vector2): Picked | null => {
      camera.updateMatrixWorld();
      raycaster.setFromCamera(ndc, camera);
      const found = raycaster.intersectObjects(stickers, false)[0];
      if (!found) return null;
      found.object.updateWorldMatrix(true, false);
      const n = forward.clone().transformDirection(found.object.matrixWorld);
      // -0 이 섞이지 않게 || 0 으로 정리한다
      const normal = [Math.round(n.x) || 0, Math.round(n.y) || 0, Math.round(n.z) || 0] as const;
      // 축 단위 벡터가 아니면 조각이 도는 중에 집은 것이라 믿을 수 없다
      if (normal.filter((v) => v !== 0).length !== 1) return null;
      return { normal, cubie: (found.object.parent as Group).userData.pos, point: found.point.clone() };
    };

    const fire = (picked: Picked, drag: Vector2) => {
      const tangent = pickTangent(picked.normal, picked.point, drag, camera, canvas);
      const move = dragMove(picked.normal, tangent, picked.cubie, size);
      if (move) emitDragMove(move);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.target !== canvas || !isInteractive()) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      const start = new Vector2(event.clientX, event.clientY);
      // 애니메이션 중에는 집을 대상이 움직이므로 큐브 드래그로 보고 멈춘 뒤에 고른다
      const picked = running > 0 ? null : pick(ndc);
      if (running === 0 && !picked) return;
      // OrbitControls 보다 먼저(capture) 실행되므로 여기서 꺼 두면 시점 회전이 시작되지 않는다
      controls.enabled = false;
      gesture = { start, ndc, picked, fired: false };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!gesture || gesture.fired) return;
      const drag = new Vector2(event.clientX, event.clientY).sub(gesture.start);
      if (drag.length() < DRAG_THRESHOLD_PX) return;
      gesture.fired = true;
      const { picked, ndc } = gesture;
      if (picked) {
        fire(picked, drag);
        return;
      }
      void waitSettled().then(() => {
        if (disposed || !isInteractive()) return;
        const settledPick = pick(ndc);
        if (settledPick) fire(settledPick, drag);
      });
    };

    el.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", reset);
    window.addEventListener("pointercancel", reset);

    return () => {
      disposed = true;
      api.current = null;
      el.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", reset);
      window.removeEventListener("pointercancel", reset);
      unwatchScheme();
      controls.dispose();
      bodyGeometry.dispose();
      stickerGeometry.dispose();
      bodyMaterial.dispose();
      stickerMaterials.forEach((m) => m.dispose());
      stage.dispose();
    };
  }, [webgl, size]);

  if (!supported) return <p className="py-20 text-center text-sm text-ink-muted">이 기기에서는 3D 화면을 표시할 수 없어요</p>;
  return <div ref={container} className="aspect-square w-full" />;
}
