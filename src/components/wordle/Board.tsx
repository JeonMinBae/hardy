import { displayWord } from "@/lib/wordle/answers";
import { evaluateGuess, type Mark } from "@/lib/wordle/evaluate";
import { MAX_GUESSES, WORD_LENGTH, type WordleState } from "@/lib/wordle/game";

// Tailwind 가 클래스를 찾을 수 있도록 전체 문자열로 둔다. 화면 키보드도 같은 색·같은 테두리를 쓴다.
// 색 외 단서: 자리까지 맞으면 실선, 다른 자리면 점선, 없으면 잉크 테두리 없이 흐린 글자
export const MARK_CLASS: Record<Mark, string> = {
  correct: "border-ink bg-ok text-ink",
  present: "border-dashed border-ink bg-near text-ink",
  absent: "border-off bg-off text-ink-muted",
};
const MARK_LABEL: Record<Mark, string> = { correct: "자리 맞음", present: "다른 자리", absent: "없음" };
const TYPED_CELL = "border-line-strong";
const EMPTY_CELL = "border-line";

interface Props {
  game: WordleState;
  /** 방금 제출해 뒤집을 줄. 없으면 null (새로고침으로 들어온 줄은 뒤집지 않는다) */
  revealRow: number | null;
  /** 흔들 줄과 그 횟수. id 가 바뀌면 다시 흔든다 */
  shake: { id: number; row: number } | null;
}

export function Board({ game, revealRow, shake }: Props) {
  const rows = Array.from({ length: MAX_GUESSES }, (_, row) =>
    row < game.guesses.length
      ? { jamo: game.guesses[row], marks: evaluateGuess(game.guesses[row], game.answer) }
      : { jamo: row === game.guesses.length ? game.current : [], marks: null },
  );
  return (
    <div aria-label="워들 판" className="flex flex-col gap-1.5">
      {rows.map(({ jamo, marks }, row) => {
        const shaking = shake !== null && shake.row === row;
        return (
          // key 가 바뀌면 줄이 다시 마운트되며 흔들림이 처음부터 재생된다
          <div key={`${row}-${shaking ? shake.id : 0}`} className={`flex items-center gap-2 ${shaking ? "animate-shake" : ""}`}>
            <div className="grid flex-1 grid-cols-7 gap-1.5">
              {Array.from({ length: WORD_LENGTH }, (_, col) => (
                <div
                  key={col}
                  aria-label={marks ? `${jamo[col]} ${MARK_LABEL[marks[col]]}` : undefined}
                  // 왼쪽 칸부터 차례로 뒤집힌다
                  style={row === revealRow ? { animationDelay: `${col * 100}ms` } : undefined}
                  className={`flex aspect-square items-center justify-center rounded-sm border-2 text-xl font-bold ${
                    marks ? MARK_CLASS[marks[col]] : jamo[col] ? TYPED_CELL : EMPTY_CELL
                  } ${row === revealRow ? "animate-flip" : ""}`}
                >
                  {jamo[col]}
                </div>
              ))}
            </div>
            {/* 7칸이 차고 조합될 때만 보인다. 3음절까지 들어갈 폭이 필요하다 */}
            <span className="w-16 truncate text-sm text-ink-muted">{jamo.length === WORD_LENGTH ? displayWord(jamo) : null}</span>
          </div>
        );
      })}
    </div>
  );
}
