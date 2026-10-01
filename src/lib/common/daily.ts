const DAY_MS = 86_400_000;
// 한국은 1988년 이후 서머타임이 없어 UTC+9 고정으로 계산해도 Asia/Seoul 날짜와 같다
const SEOUL_OFFSET_MS = 9 * 3_600_000;

const seoulMs = (now: number) => now + SEOUL_OFFSET_MS;

/** 1970-01-01(한국 시간)부터 센 날 수 */
export const seoulDay = (now: number) => Math.floor(seoulMs(now) / DAY_MS);

/** firstDayUtc 는 Date.UTC(연, 월, 일). 그날(한국 시간)이 1번이고, 기준일 이전 시계는 1번 */
export const dailyNumber = (now: number, firstDayUtc: number) => Math.max(1, seoulDay(now) - firstDayUtc / DAY_MS + 1);

/** 한국 시간 자정까지 남은 초(올림) */
export const secondsUntilSeoulMidnight = (now: number) => Math.ceil((DAY_MS - (seoulMs(now) % DAY_MS)) / 1000);
