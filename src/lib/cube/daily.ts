import { dailyNumber } from "@/lib/common/daily";

// 한국 시간 2026-10-01 이 1번 문제다
const FIRST_PUZZLE_DAY = Date.UTC(2026, 9, 1);

export const cubePuzzleNumber = (now: number) => dailyNumber(now, FIRST_PUZZLE_DAY);
