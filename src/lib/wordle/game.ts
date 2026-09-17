import { compose, decompose } from "./jamo";

export const WORD_LENGTH = 6;
export const MAX_GUESSES = 6;

export type Status = "playing" | "won" | "lost";
export type SubmitError = "incomplete" | "invalid";

export interface WordleState {
  puzzle: number;
  /** 정답 원래 표기(결과 모달에 보여준다) */
  answerWord: string;
  answer: readonly string[];
  guesses: string[][];
  /** 입력 중인 줄. 저장하지 않는다 */
  current: string[];
}

export function createGame(puzzle: number, answerWord: string, guesses: string[][]): WordleState {
  return { puzzle, answerWord, answer: decompose(answerWord)!, guesses, current: [] };
}

export function statusOf({ guesses, answer }: WordleState): Status {
  const key = answer.join("");
  if (guesses.some((guess) => guess.join("") === key)) return "won";
  return guesses.length >= MAX_GUESSES ? "lost" : "playing";
}

/** 키 하나가 넣는 자모(두 개일 수 있음)를 모두 넣을 칸이 없으면 통째로 무시한다 */
export function typeJamo(state: WordleState, jamo: readonly string[]): WordleState {
  if (statusOf(state) !== "playing" || state.current.length + jamo.length > WORD_LENGTH) return state;
  return { ...state, current: [...state.current, ...jamo] };
}

export function deleteJamo(state: WordleState): WordleState {
  if (statusOf(state) !== "playing" || state.current.length === 0) return state;
  return { ...state, current: state.current.slice(0, -1) };
}

/** 거절된 제출은 상태를 바꾸지 않으므로 시도 횟수에 들어가지 않는다 */
export function submitGuess(state: WordleState): { state: WordleState; error: SubmitError | null } {
  if (statusOf(state) !== "playing") return { state, error: null };
  if (state.current.length < WORD_LENGTH) return { state, error: "incomplete" };
  if (compose(state.current) === null) return { state, error: "invalid" };
  return { state: { ...state, guesses: [...state.guesses, state.current], current: [] }, error: null };
}
