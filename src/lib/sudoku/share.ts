import { formatElapsed } from "@/lib/common/time";
import { DIFFICULTY_LABEL, MODE_LABEL } from "./display";
import { hintCount, restartSnapshot } from "./game";
import type { Snapshot } from "./types";
import { buildGameSearch } from "./url";

/** 받는 사람이 같은 문제를 처음부터 풀 수 있게, 입력·힌트·메모·시간을 지운 링크를 만든다 */
export const shareUrl = (origin: string, snapshot: Snapshot): string => `${origin}/sudoku?${buildGameSearch(restartSnapshot(snapshot))}`;

/** completedElapsed 가 null 이면 아직 푸는 중이라 기록 줄 없이 문제만 소개한다 */
export function shareText(snapshot: Snapshot, url: string, completedElapsed: number | null): string {
  const title = `hardy 스도쿠 ${MODE_LABEL[snapshot.mode]} · ${DIFFICULTY_LABEL[snapshot.difficulty]}`;
  const record = completedElapsed === null ? [] : [`${formatElapsed(completedElapsed)} · 힌트 ${hintCount(snapshot)}회`];
  return [title, ...record, "", url].join("\n");
}
