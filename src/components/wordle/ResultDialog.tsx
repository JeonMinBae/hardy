"use client";

import { useState } from "react";
import { Dialog } from "@/components/common/Dialog";
import { formatElapsed } from "@/lib/common/time";
import { evaluateGuess } from "@/lib/wordle/evaluate";
import { statusOf, type WordleState } from "@/lib/wordle/game";
import { computeStats, shareText, type Results } from "@/lib/wordle/stats";
import { StatsSummary } from "./StatsSummary";

const COPY_MESSAGE = { done: "복사했어요", failed: "복사하지 못했어요" } as const;
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
  const [copy, setCopy] = useState<keyof typeof COPY_MESSAGE | null>(null);
  const won = statusOf(game) === "won";

  const share = async () => {
    const text = shareText(game.puzzle, game.guesses.map((guess) => evaluateGuess(guess, game.answer)), won);
    try {
      // 비보안 컨텍스트에는 clipboard 가 없어 TypeError, 권한 거부는 reject 로 온다
      await navigator.clipboard.writeText(text);
      setCopy("done");
    } catch {
      setCopy("failed");
    }
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
        {copy && (
          <p role="status" className="text-center text-sm">
            {COPY_MESSAGE[copy]}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => void share()} className={PRIMARY}>
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
