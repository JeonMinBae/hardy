import { describe, expect, it } from "vitest";
import { encodePractice } from "./codec";
import { faceMove } from "./notation";
import { buildPracticeSearch, parseCubeSearch } from "./url";

const parse = (q: string) => parseCubeSearch(new URLSearchParams(q));
const snapshot = { size: 2 as const, scramble: [faceMove("R", false, 2)], history: [], moveCount: 0, elapsed: 0 };

describe("parseCubeSearch", () => {
  it.each([
    ["", { kind: "select" }],
    ["d=3", { kind: "daily", size: 3 }],
    ["p=2", { kind: "newPractice", size: 2 }],
    ["d=4", { kind: "invalid" }],
    ["d=3&p=3", { kind: "invalid" }],
    ["p=3&s=@@", { kind: "invalid" }],
  ])("%s", (q, route) => {
    expect(parse(q)).toEqual(route);
  });

  it("p 와 s 의 크기가 다르면 invalid", () => {
    expect(parse(`p=3&s=${encodePractice(snapshot)}`)).toEqual({ kind: "invalid" });
  });

  it("buildPracticeSearch 결과를 다시 읽으면 같은 진행", () => {
    expect(parse(buildPracticeSearch(snapshot)!)).toEqual({ kind: "practice", snapshot });
  });
});
