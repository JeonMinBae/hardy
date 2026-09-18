"use client";

import { Dialog } from "@/components/common/Dialog";
import { useCopyToClipboard } from "@/components/common/useCopyToClipboard";
import { formatElapsed } from "@/lib/common/time";
import { evaluateGuess } from "@/lib/wordle/evaluate";
import { statusOf, type WordleState } from "@/lib/wordle/game";
import { computeStats, shareText, type Results } from "@/lib/wordle/stats";
import { StatsSummary } from "./StatsSummary";

const BUTTON = "rounded-md bg-slate-100 px-2 py-2 text-sm dark:bg-slate-800";
const PRIMARY = "rounded-md bg-slate-900 px-2 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900";

interface Props {
  game: WordleState;
  results: Results;
  /** 다음 문제까지 남은 초. 아직 모르면 null */
  secondsLeft: number | null;
  onClose: () => void;
}

export function ResultDialog({ game, results, secondsLeft, onClose }: Props) {
  const { copy, message } = useCopyToClipboard();
  const won = statusOf(game) === "won";

  const share = () => {
    const rows = game.guesses.map((guess) => evaluateGuess(guess, game.answer));
    void copy(shareText(rows, won, `${window.location.origin}/wordle`));
  };

  return (
    <Dialog title={won ? "정답!" : "아쉬워요"}>
      <div className="flex flex-col gap-4">
        <p className="text-center">
          정답 <strong className="text-2xl">{game.answerWord}</strong>
        </p>
        <StatsSummary stats={computeStats(results, game.puzzle)} highlight={won ? game.guesses.length : null} />
        <p className="flex justify-between text-sm">
          <span>다음 문제까지</span>
          <span className="font-mono tabular-nums">{secondsLeft === null ? "" : formatElapsed(secondsLeft)}</span>
        </p>
        {message && (
          <p role="status" className="text-center text-sm">
            {message}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={share} className={PRIMARY}>
            결과 공유
          </button>
          <button type="button" onClick={onClose} className={BUTTON}>
            닫기
          </button>
        </div>
      </div>
    </Dialog>
  );
}
