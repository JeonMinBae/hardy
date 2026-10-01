import { formatElapsed } from "@/lib/common/time";
import type { CubeSize, Move } from "./cube";
import type { DailyResult } from "./saved";
import { buildDailySearch, buildPracticeSearch } from "./url";

export function dailyShareText(size: CubeSize, puzzle: number, result: DailyResult, url: string): string {
  const record = result === "lost" ? "포기" : `⏱ ${formatElapsed(result.seconds)} · ${result.moves}수`;
  return [`hardy 큐브 ${size}×${size} #${puzzle}`, record, "", url].join("\n");
}

export const dailyUrl = (origin: string, size: CubeSize) => `${origin}/cube?${buildDailySearch(size)}`;

/** 받는 사람이 같은 섞기를 처음부터 풀 수 있게 회전·시간을 지운 링크 */
export const practiceShareUrl = (origin: string, size: CubeSize, scramble: readonly Move[]) =>
  `${origin}/cube?${buildPracticeSearch({ size, scramble, history: [], moveCount: 0, elapsed: 0 })}`;
