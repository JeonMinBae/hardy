import { describe, expect, it } from "vitest";
import { deserializeCompleted, serializeCompleted } from "./completed";

describe("serializeCompleted / deserializeCompleted", () => {
  it("왕복한다", () => {
    const ids = new Set(["10-1", "20-1"]);
    expect(deserializeCompleted(serializeCompleted(ids))).toEqual(ids);
  });

  it("지금 퍼즐 데이터에 없는 ID 는 버린다", () => {
    expect(deserializeCompleted(serializeCompleted(new Set(["10-1", "10-9999", "cat"])))).toEqual(new Set(["10-1"]));
  });

  it.each([
    ["저장된 값 없음", null],
    ["JSON 아님", "{"],
    ["알 수 없는 버전", JSON.stringify({ version: 2, completed: ["10-1"] })],
    ["목록이 배열이 아님", JSON.stringify({ version: 1, completed: "10-1" })],
    ["문자열이 아닌 ID", JSON.stringify({ version: 1, completed: ["10-1", 3] })],
  ])("%s → 빈 기록", (_, raw) => {
    expect(deserializeCompleted(raw)).toEqual(new Set());
  });
});
