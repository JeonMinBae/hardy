import { summarizeDaily, type DailySummary } from "@/lib/common/streak";
import { codeToMove, MAX_ELAPSED, moveToCode } from "./codec";
import { CUBE_SIZES, type CubeSize, type Move } from "./cube";

export const STORAGE_KEY = "hardy:cube";
const VERSION = 1;

export interface SolveRecord {
  seconds: number;
  moves: number;
}
export type DailyResult = SolveRecord | "lost";
export type DailyResults = Record<number, DailyResult>;
export interface DailyProgress {
  puzzle: number;
  history: Move[];
  moveCount: number;
  elapsed: number;
}

export interface SavedData {
  today: Partial<Record<CubeSize, DailyProgress>>;
  results: Record<CubeSize, DailyResults>;
  /** 시간과 이동 수는 서로 다른 판에서 나온 최솟값일 수 있다 */
  best: Record<CubeSize, SolveRecord | null>;
  helpSeen: boolean;
}

export const EMPTY_DATA: SavedData = { today: {}, results: { 2: {}, 3: {} }, best: { 2: null, 3: null }, helpSeen: false };

export function serialize(data: SavedData): string {
  const today = Object.fromEntries(
    Object.entries(data.today).map(([size, p]) => [size, { ...p, history: p.history.map((m) => moveToCode(m, Number(size) as CubeSize)) }]),
  );
  return JSON.stringify({ version: VERSION, today, results: data.results, best: data.best, helpSeen: data.helpSeen });
}

const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
const isRecord = (v: unknown): v is SolveRecord =>
  typeof v === "object" && v !== null && isCount((v as SolveRecord).seconds) && isCount((v as SolveRecord).moves);
const isResult = (v: unknown) => v === "lost" || isRecord(v);
const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function readProgress(raw: unknown, size: CubeSize): DailyProgress | null {
  if (
    !isPlainObject(raw) ||
    !isCount(raw.puzzle) ||
    raw.puzzle < 1 ||
    !isCount(raw.moveCount) ||
    !isCount(raw.elapsed) ||
    !Array.isArray(raw.history)
  )
    return null;
  const history = raw.history.map((code) => codeToMove(code as number, size));
  if (history.some((m) => m === null) || raw.moveCount < history.length) return null;
  return { puzzle: raw.puzzle, history: history as Move[], moveCount: raw.moveCount, elapsed: Math.min(raw.elapsed, MAX_ELAPSED) };
}

/** results·best·helpSeen 이 어긋나면 저장된 것이 없는 것으로 본다. today 는 어긋난 크기만 버린다 */
export function deserialize(raw: string | null): SavedData {
  if (raw === null) return EMPTY_DATA;
  try {
    const data = JSON.parse(raw);
    if (data?.version !== VERSION || typeof data.helpSeen !== "boolean" || !isPlainObject(data.results) || !isPlainObject(data.best))
      return EMPTY_DATA;
    const results = {} as SavedData["results"];
    const best = {} as SavedData["best"];
    const today: SavedData["today"] = {};
    for (const size of CUBE_SIZES) {
      const sizeResults = data.results[size];
      if (!isPlainObject(sizeResults)) return EMPTY_DATA;
      const entries = Object.entries(sizeResults);
      if (!entries.every(([puzzle, result]) => Number.isInteger(Number(puzzle)) && Number(puzzle) >= 1 && isResult(result))) return EMPTY_DATA;
      results[size] = Object.fromEntries(entries.map(([puzzle, result]) => [Number(puzzle), result])) as DailyResults;
      const sizeBest = data.best[size];
      if (sizeBest !== null && !isRecord(sizeBest)) return EMPTY_DATA;
      best[size] = sizeBest;
      const progress = isPlainObject(data.today) ? readProgress(data.today[size], size) : null;
      if (progress) today[size] = progress;
    }
    return { today, results, best, helpSeen: data.helpSeen };
  } catch {
    return EMPTY_DATA;
  }
}

export const updateBest = (best: SolveRecord | null, record: SolveRecord): SolveRecord =>
  best === null ? record : { seconds: Math.min(best.seconds, record.seconds), moves: Math.min(best.moves, record.moves) };

/** 데일리를 끝낸다. 결과를 남기고 그 크기의 진행은 지운다. 성공이면 최고 기록도 갱신한다 */
export function finishDaily(data: SavedData, size: CubeSize, puzzle: number, result: DailyResult): SavedData {
  const today = { ...data.today };
  delete today[size];
  // 다른 탭이 먼저 끝낸 판이면 처음 결과와 최고 기록을 그대로 둔다
  if (data.results[size][puzzle] !== undefined) return { ...data, today };
  return {
    ...data,
    today,
    results: { ...data.results, [size]: { ...data.results[size], [puzzle]: result } },
    best: result === "lost" ? data.best : { ...data.best, [size]: updateBest(data.best[size], result) },
  };
}

/** 연습에서 성공한 판은 최고 기록에만 반영한다 */
export const finishPractice = (data: SavedData, size: CubeSize, record: SolveRecord): SavedData => ({
  ...data,
  best: { ...data.best, [size]: updateBest(data.best[size], record) },
});

export const computeCubeStats = (results: DailyResults, today: number): DailySummary => summarizeDaily(results, today, (r) => r !== "lost");
