import type { CubeSize } from "./cube";
import { decodePractice, encodePractice, type PracticeSnapshot } from "./codec";

export type CubeRoute =
  | { kind: "select" }
  | { kind: "daily"; size: CubeSize }
  | { kind: "newPractice"; size: CubeSize }
  | { kind: "practice"; snapshot: PracticeSnapshot }
  | { kind: "invalid" };

const parseSize = (v: string | null): CubeSize | null => (v === "2" ? 2 : v === "3" ? 3 : null);

export function parseCubeSearch(params: URLSearchParams): CubeRoute {
  const d = params.get("d");
  const p = params.get("p");
  const s = params.get("s");
  // d·p·s 외의 파라미터는 보지 않는다
  if (d === null && p === null && s === null) return { kind: "select" };
  if (d !== null) {
    const size = parseSize(d);
    return size && p === null && s === null ? { kind: "daily", size } : { kind: "invalid" };
  }
  const size = parseSize(p);
  if (!size) return { kind: "invalid" };
  if (s === null) return { kind: "newPractice", size };
  const snapshot = decodePractice(s);
  return snapshot && snapshot.size === size ? { kind: "practice", snapshot } : { kind: "invalid" };
}

/** "?" 없이 돌려준다. 인코딩할 수 없으면 null */
export function buildPracticeSearch(snapshot: PracticeSnapshot): string | null {
  const s = encodePractice(snapshot);
  return s === null ? null : new URLSearchParams({ p: String(snapshot.size), s }).toString();
}

export const buildDailySearch = (size: CubeSize) => `d=${size}`;
