"use client";

import { Dialog } from "@/components/common/Dialog";
import { useCopyToClipboard } from "@/components/common/useCopyToClipboard";
import { formatElapsed } from "@/lib/common/time";
import type { CubeSize, Move } from "@/lib/cube/cube";
import { computeCubeStats, type DailyResult, type SolveRecord } from "@/lib/cube/saved";
import { dailyShareText, dailyUrl, practiceShareUrl } from "@/lib/cube/share";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const BUTTON = `min-h-11 rounded-md border border-line-strong px-2 py-2 text-sm ${FOCUS}`;
const PRIMARY = `min-h-11 rounded-md bg-accent px-2 py-2 text-sm text-surface active:scale-[0.99] ${FOCUS}`;

interface Props {
  size: CubeSize;
  /** 데일리면 문제 번호, 연습이면 null */
  puzzle: number | null;
  scramble: readonly Move[];
  result: DailyResult;
  /** 이 크기의 데일리 결과 전체 */
  results: Record<number, DailyResult>;
  best: SolveRecord | null;
  onNewScramble: () => void;
  onClose: () => void;
}

export function ResultDialog({ size, puzzle, scramble, result, results, best, onNewScramble, onClose }: Props) {
  const { copy, message } = useCopyToClipboard();
  const lost = result === "lost";
  const stats = puzzle === null ? null : computeCubeStats(results, puzzle);

  const share = () => {
    const origin = window.location.origin;
    void copy(puzzle === null ? practiceShareUrl(origin, size, scramble) : dailyShareText(size, puzzle, result, dailyUrl(origin, size)));
  };

  const items =
    stats &&
    ([
      ["플레이", stats.played],
      ["승률", `${stats.winRate}%`],
      ["현재 연속", stats.currentStreak],
      ["최장 연속", stats.maxStreak],
    ] as const);

  return (
    <Dialog title={lost ? "다음엔 꼭" : "완성!"}>
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-ink-muted">시간</dt>
          <dd className="text-right font-numeral tabular-nums">{lost ? "포기" : formatElapsed(result.seconds)}</dd>
          <dt className="text-ink-muted">이동 수</dt>
          <dd className="text-right font-numeral tabular-nums">{lost ? "포기" : `${result.moves}수`}</dd>
        </dl>
        {items && (
          <dl className="grid grid-cols-4 text-center">
            {items.map(([label, value]) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="text-xs text-ink-muted">{label}</dt>
                <dd className="font-numeral text-xl font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {best && (
          <p className="text-center text-sm text-ink-muted">
            최고 기록 <span className="font-numeral tabular-nums">{formatElapsed(best.seconds)}</span> ·{" "}
            <span className="font-numeral tabular-nums">{best.moves}수</span>
          </p>
        )}
        {message && (
          <p role="status" className="text-center text-sm">
            {message}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={share} className={PRIMARY}>
            {puzzle === null ? "같은 섞기 링크 복사" : "결과 공유"}
          </button>
          {puzzle === null && (
            <button type="button" onClick={onNewScramble} className={BUTTON}>
              새로 섞기
            </button>
          )}
          <button type="button" onClick={onClose} className={BUTTON}>
            닫기
          </button>
        </div>
      </div>
    </Dialog>
  );
}
