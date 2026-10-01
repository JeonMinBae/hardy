import { expect, it } from "vitest";
import { cubePuzzleNumber } from "./daily";

it("한국 시간 2026-10-01 이 1번, 다음 날이 2번", () => {
  expect(cubePuzzleNumber(Date.parse("2026-10-01T09:00:00+09:00"))).toBe(1);
  expect(cubePuzzleNumber(Date.parse("2026-10-02T00:00:00+09:00"))).toBe(2);
});
