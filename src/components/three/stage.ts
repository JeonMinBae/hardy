import { Color, PerspectiveCamera, Scene, WebGLRenderer } from "three";

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    // three 0.186 의 WebGLRenderer 는 WebGL 2 만 지원한다
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

/** data-game 범위의 CSS 변수(예: --cube-u)를 three 색으로 읽는다 */
export const readCssColor = (el: Element, name: string) => new Color(getComputedStyle(el).getPropertyValue(name).trim());

export function watchColorScheme(onChange: () => void): () => void {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export interface Stage {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  dispose(): void;
}

/** container 폭에 맞춘 정사각 캔버스. 배경은 투명이라 CSS canvas 색이 그대로 보인다 */
export function createStage(container: HTMLElement): Stage {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // 캔버스 위 드래그가 페이지 스크롤·확대로 새지 않게 한다
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  const resize = () => {
    const size = container.clientWidth;
    renderer.setSize(size, size);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
  return {
    scene,
    camera,
    renderer,
    dispose() {
      observer.disconnect();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
