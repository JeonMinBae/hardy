import { describe, expect, it } from "vitest";
import { faceMove } from "./notation";
import { computeCubeStats, deserialize, EMPTY_DATA, finishDaily, finishPractice, serialize, type SavedData } from "./saved";

const data: SavedData = {
  ...EMPTY_DATA,
  today: { 3: { puzzle: 4, history: [faceMove("R", false, 3)], moveCount: 3, elapsed: 40 } },
  results: { 2: { 3: { seconds: 30, moves: 12 } }, 3: { 3: "lost" } },
  best: { 2: { seconds: 30, moves: 12 }, 3: null },
  helpSeen: true,
};

describe("serialize / deserialize", () => {
  it("왕복", () => {
    expect(deserialize(serialize(data))).toEqual(data);
  });
  it.each([null, "{", '{"version":2}', JSON.stringify({ ...JSON.parse(serialize(data)), results: { 2: { 1: "won" }, 3: {} } })])(
    "읽을 수 없으면 빈 데이터: %s",
    (raw) => {
      expect(deserialize(raw)).toEqual(EMPTY_DATA);
    },
  );
  it("today 의 한 크기만 손상되면 그 크기만 버린다", () => {
    const raw = JSON.parse(serialize(data));
    raw.today[3].history = [99];
    expect(deserialize(JSON.stringify(raw))).toEqual({ ...data, today: {} });
  });
});

describe("finishDaily / finishPractice", () => {
  it("성공은 결과·최고 기록을 남기고 진행을 지운다. 최고 기록은 항목별 최소", () => {
    const next = finishDaily({ ...data, best: { 2: null, 3: { seconds: 50, moves: 30 } } }, 3, 4, { seconds: 60, moves: 25 });
    expect(next.today[3]).toBeUndefined();
    expect(next.results[3][4]).toEqual({ seconds: 60, moves: 25 });
    expect(next.best[3]).toEqual({ seconds: 50, moves: 25 });
  });
  it("이미 결과가 있으면 처음 결과와 최고 기록을 유지한다", () => {
    const next = finishDaily(data, 3, 3, { seconds: 10, moves: 5 });
    expect(next.today[3]).toBeUndefined();
    expect(next.results[3][3]).toBe("lost");
    expect(next.best).toEqual(data.best);
  });
  it("포기는 최고 기록을 바꾸지 않는다", () => {
    expect(finishDaily(data, 2, 4, "lost").best).toEqual(data.best);
  });
  it("연습 성공은 결과 없이 최고 기록만", () => {
    const next = finishPractice(data, 2, { seconds: 20, moves: 40 });
    expect(next.results).toEqual(data.results);
    expect(next.best[2]).toEqual({ seconds: 20, moves: 12 });
  });
});

it("computeCubeStats 는 lost 를 실패로 센다", () => {
  expect(computeCubeStats({ 1: { seconds: 1, moves: 1 }, 2: "lost" }, 2)).toMatchObject({ played: 2, winRate: 50, currentStreak: 0 });
});
