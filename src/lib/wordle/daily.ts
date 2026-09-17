const DAY_MS = 86_400_000;
// 한국은 1988년 이후 서머타임이 없어 UTC+9 고정으로 계산해도 Asia/Seoul 날짜와 같다
const SEOUL_OFFSET_MS = 9 * 3_600_000;
// 한국 시간 2026-09-17 이 1번 문제다
const FIRST_PUZZLE_DAY = Date.UTC(2026, 8, 17) / DAY_MS;

const seoulMs = (now: number) => now + SEOUL_OFFSET_MS;

/** 기기 시간대와 무관하게 한국 시간 날짜로 문제 번호를 정한다. 기준일 이전 시계는 1번 */
export const puzzleNumber = (now: number) => Math.max(1, Math.floor(seoulMs(now) / DAY_MS) - FIRST_PUZZLE_DAY + 1);

/** 한국 시간 자정까지 남은 초(올림) */
export const secondsUntilNextPuzzle = (now: number) => Math.ceil((DAY_MS - (seoulMs(now) % DAY_MS)) / 1000);
