import { MAX_GUESSES, WORD_LENGTH } from "./game";
import { isJamo } from "./jamo";
import type { Results } from "./stats";

export const STORAGE_KEY = "hardy:wordle";
const VERSION = 2;
// 자모 6개·6번 시도 시절이 1이다. 그때 진행 중이던 줄은 길이가 안 맞아 버려지지만 통계는 그대로 읽는다
const READABLE_VERSIONS: readonly number[] = [1, 2];

export interface SavedData {
  /** 오늘 문제의 제출한 줄. 입력 중인 줄은 넣지 않는다 */
  today: { puzzle: number; guesses: string[][] } | null;
  results: Results;
  helpSeen: boolean;
}

export const EMPTY_DATA: SavedData = { today: null, results: {}, helpSeen: false };

export function serialize({ today, results, helpSeen }: SavedData): string {
  const savedToday = today && { puzzle: today.puzzle, guesses: today.guesses.map((guess) => guess.join("")) };
  return JSON.stringify({ version: VERSION, today: savedToday, results, helpSeen });
}

const isPuzzle = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 1;
const isResult = (value: unknown) => value === "lost" || (Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_GUESSES);
const isGuess = (value: unknown): value is string => typeof value === "string" && value.length === WORD_LENGTH && [...value].every(isJamo);

/** results 나 helpSeen 이 어긋나면 저장된 것이 없는 것으로 본다. today 만 어긋나면 그것만 버린다 */
export function deserialize(raw: string | null): SavedData {
  if (raw === null) return EMPTY_DATA;
  try {
    const data = JSON.parse(raw);
    if (!READABLE_VERSIONS.includes(data?.version) || typeof data.helpSeen !== "boolean") return EMPTY_DATA;
    if (typeof data.results !== "object" || data.results === null || Array.isArray(data.results)) return EMPTY_DATA;
    const entries = Object.entries(data.results);
    if (!entries.every(([puzzle, result]) => isPuzzle(Number(puzzle)) && isResult(result))) return EMPTY_DATA;
    const { today } = data;
    const todayUsable = isPuzzle(today?.puzzle) && Array.isArray(today.guesses) && today.guesses.length <= MAX_GUESSES && today.guesses.every(isGuess);
    return {
      today: todayUsable ? { puzzle: today.puzzle, guesses: today.guesses.map((guess: string) => [...guess]) } : null,
      results: Object.fromEntries(entries.map(([puzzle, result]) => [Number(puzzle), result])) as Results,
      helpSeen: data.helpSeen,
    };
  } catch {
    return EMPTY_DATA;
  }
}

/** 저장된 진행이 다른 날 문제면 버린다 */
export const guessesFor = (data: SavedData, puzzle: number): string[][] => (data.today?.puzzle === puzzle ? data.today.guesses : []);
