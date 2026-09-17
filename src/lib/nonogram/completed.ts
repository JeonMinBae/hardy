import { findPuzzle } from "./puzzles";

export const COMPLETED_KEY = "hardy:nonogram";
const VERSION = 1;

export const serializeCompleted = (ids: ReadonlySet<string>) => JSON.stringify({ version: VERSION, completed: [...ids] });

/** 버전이 다르거나 모양이 어긋나면 빈 기록. 지금 퍼즐 데이터에 없는 ID 는 버린다 */
export function deserializeCompleted(raw: string | null): Set<string> {
  if (raw === null) return new Set();
  try {
    const data = JSON.parse(raw);
    if (data?.version !== VERSION || !Array.isArray(data.completed)) return new Set();
    if (!data.completed.every((id: unknown) => typeof id === "string")) return new Set();
    return new Set((data.completed as string[]).filter((id) => findPuzzle(id) !== null));
  } catch {
    return new Set();
  }
}
