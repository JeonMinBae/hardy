import allowed from "./allowed.json";
import answers from "./answers.json";
import { compose, decompose } from "./jamo";

/** 출제 순서대로 섞은 정답 단어. scripts/build-wordle-answers.mts 가 만든다 */
export const ANSWERS: readonly string[] = answers;

/** 제출할 수 있는 단어(정답 포함). 같은 스크립트가 만든다 */
export const ALLOWED: readonly string[] = allowed;

export const answerForPuzzle = (puzzle: number) => ANSWERS[(puzzle - 1) % ANSWERS.length];

// 조합 규칙으로는 다르게 보이는 단어(각각 → 가깍)가 있어 사전 표기를 먼저 찾는다
const WORD_BY_JAMO = new Map(ALLOWED.map((word) => [decompose(word)!.join(""), word]));

export const isAllowed = (jamo: readonly string[]) => WORD_BY_JAMO.has(jamo.join(""));

/** 줄 옆에 보여줄 조합 글자. 조합할 수 없으면 null */
export const displayWord = (jamo: readonly string[]) => WORD_BY_JAMO.get(jamo.join("")) ?? compose(jamo);
