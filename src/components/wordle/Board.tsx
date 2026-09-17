import { displayWord } from "@/lib/wordle/answers";
import { evaluateGuess, type Mark } from "@/lib/wordle/evaluate";
import { MAX_GUESSES, WORD_LENGTH, type WordleState } from "@/lib/wordle/game";

// Tailwind 가 클래스를 찾을 수 있도록 전체 문자열로 둔다. 화면 키보드도 같은 색을 쓴다
export const MARK_CLASS: Record<Mark, string> = {
  correct: "border-emerald-600 bg-emerald-600 text-white",
  present: "border-amber-500 bg-amber-500 text-white",
  // 다크에서는 미판정 키(slate-500)보다 어둡게 둬야 구분된다
  absent: "border-slate-500 bg-slate-500 text-white dark:border-slate-700 dark:bg-slate-700",
};
const MARK_LABEL: Record<Mark, string> = { correct: "자리 맞음", present: "다른 자리", absent: "없음" };
const TYPED_CELL = "border-slate-500 dark:border-slate-400";
const EMPTY_CELL = "border-slate-300 dark:border-slate-700";

export function Board({ game }: { game: WordleState }) {
  const rows = Array.from({ length: MAX_GUESSES }, (_, row) =>
    row < game.guesses.length
      ? { jamo: game.guesses[row], marks: evaluateGuess(game.guesses[row], game.answer) }
      : { jamo: row === game.guesses.length ? game.current : [], marks: null },
  );
  return (
    <div aria-label="워들 판" className="flex flex-col gap-1.5">
      {rows.map(({ jamo, marks }, row) => (
        <div key={row} className="flex items-center gap-2">
          <div className="grid flex-1 grid-cols-6 gap-1.5">
            {Array.from({ length: WORD_LENGTH }, (_, col) => (
              <div
                key={col}
                aria-label={marks ? `${jamo[col]} ${MARK_LABEL[marks[col]]}` : undefined}
                className={`flex aspect-square items-center justify-center rounded-md border-2 text-xl font-bold ${
                  marks ? MARK_CLASS[marks[col]] : jamo[col] ? TYPED_CELL : EMPTY_CELL
                }`}
              >
                {jamo[col]}
              </div>
            ))}
          </div>
          {/* 6칸이 차고 조합될 때만 보인다 */}
          <span className="w-14 truncate text-sm text-slate-600 dark:text-slate-300">
            {jamo.length === WORD_LENGTH ? displayWord(jamo) : null}
          </span>
        </div>
      ))}
    </div>
  );
}
