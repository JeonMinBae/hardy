import answers from "./answers.json";
import { compose, decompose } from "./jamo";

/** 출제 순서대로 섞은 정답 단어. scripts/build-wordle-answers.mts 가 만든다 */
export const ANSWERS: readonly string[] = answers;

export const answerForPuzzle = (puzzle: number) => ANSWERS[(puzzle - 1) % ANSWERS.length];

// 조합 규칙으로는 다르게 보이는 정답(각각 → 가깍)이 있어 정답 목록을 먼저 찾는다
const WORD_BY_JAMO = new Map(ANSWERS.map((word) => [decompose(word)!.join(""), word]));

/** 줄 옆에 보여줄 조합 글자. 조합할 수 없으면 null */
export const displayWord = (jamo: readonly string[]) => WORD_BY_JAMO.get(jamo.join("")) ?? compose(jamo);
