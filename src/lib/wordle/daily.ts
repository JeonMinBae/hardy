import { dailyNumber, secondsUntilSeoulMidnight } from "@/lib/common/daily";

// 한국 시간 2026-09-17 이 1번 문제다
const FIRST_PUZZLE_DAY = Date.UTC(2026, 8, 17);

/** 기기 시간대와 무관하게 한국 시간 날짜로 문제 번호를 정한다. 기준일 이전 시계는 1번 */
export const puzzleNumber = (now: number) => dailyNumber(now, FIRST_PUZZLE_DAY);

export const secondsUntilNextPuzzle = secondsUntilSeoulMidnight;
