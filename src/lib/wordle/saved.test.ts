import { describe, expect, it } from "vitest";
import { deserialize, EMPTY_DATA, guessesFor, serialize, type SavedData } from "./saved";

const DATA: SavedData = {
  today: { puzzle: 3, guesses: [[..."ㄱㅏㄴㅅㅏㄴ"], [..."ㄱㅕㅣㅅㅏㄴ"]] },
  results: { 1: 4, 2: "lost", 3: 2 },
  helpSeen: true,
};

describe("serialize / deserialize", () => {
  it("저장한 뒤 불러오면 같다", () => {
    expect(deserialize(serialize(DATA))).toEqual(DATA);
    expect(deserialize(serialize(EMPTY_DATA))).toEqual(EMPTY_DATA);
  });

  it("줄은 자모를 이은 문자열로 저장한다", () => {
    expect(JSON.parse(serialize(DATA)).today.guesses).toEqual(["ㄱㅏㄴㅅㅏㄴ", "ㄱㅕㅣㅅㅏㄴ"]);
  });

  const raw = serialize(DATA);
  it.each([
    ["저장된 값 없음", null],
    ["JSON 아님", "{"],
    ["배열", "[]"],
    ["알 수 없는 버전", raw.replace('"version":1', '"version":2')],
    ["자모 5개인 줄", raw.replace("ㄱㅕㅣㅅㅏㄴ", "ㄱㅕㅣㅅㅏ")],
    ["기본 자모가 아닌 글자", raw.replace("ㄱㅕㅣㅅㅏㄴ", "ㄲㅕㅣㅅㅏㄴ")],
    ["7줄", serialize({ ...DATA, today: { puzzle: 3, guesses: Array(7).fill([..."ㄱㅏㄴㅅㅏㄴ"]) } })],
    ["결과가 7회", raw.replace('"1":4', '"1":7')],
    ["결과 문자열이 lost 가 아님", raw.replace('"lost"', '"win"')],
    ["문제 번호 0", raw.replace('"1":4', '"0":4')],
    ["helpSeen 누락", raw.replace(',"helpSeen":true', "")],
  ])("%s → 빈 데이터", (_, value) => {
    expect(deserialize(value)).toEqual(EMPTY_DATA);
  });
});

it("guessesFor 는 오늘 문제의 줄만 돌려주고 다른 날 진행은 버린다", () => {
  expect(guessesFor(DATA, 3)).toHaveLength(2);
  expect(guessesFor(DATA, 4)).toEqual([]);
  expect(guessesFor(EMPTY_DATA, 3)).toEqual([]);
});
