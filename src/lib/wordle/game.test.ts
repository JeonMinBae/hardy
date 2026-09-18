import { describe, expect, it } from "vitest";
import { createGame, deleteJamo, statusOf, submitGuess, typeJamo, type WordleState } from "./game";

const newGame = (guesses: string[] = []) => createGame(7, "강아지", guesses.map((g) => [...g]));
const type = (state: WordleState, text: string) => [...text].reduce((s, jamo) => typeJamo(s, [jamo]), state);

describe("typeJamo / deleteJamo", () => {
  it("두 자모 키는 남은 칸이 둘보다 적으면 통째로 무시한다", () => {
    const six = type(newGame(), "ㅅㅏㅇㅓㅂㄱ");
    expect(typeJamo(six, ["ㅏ", "ㅣ"])).toBe(six);
    expect(typeJamo(six, ["ㅏ"]).current).toHaveLength(7);
    expect(typeJamo(type(newGame(), "ㅅㅏㅇㅓㅂ"), ["ㅏ", "ㅣ"]).current).toEqual([..."ㅅㅏㅇㅓㅂㅏㅣ"]);
  });

  it("삭제는 자모 하나씩 지우고, 빈 줄에서는 아무것도 하지 않는다", () => {
    expect(deleteJamo(type(newGame(), "ㄱㅏ")).current).toEqual(["ㄱ"]);
    const empty = newGame();
    expect(deleteJamo(empty)).toBe(empty);
  });
});

describe("submitGuess", () => {
  it("7칸이 안 찼거나 조합되지 않으면 거절하고 시도로 세지 않는다", () => {
    const six = type(newGame(), "ㅅㅏㅇㅓㅂㄱ");
    expect(submitGuess(six)).toEqual({ state: six, error: "incomplete" });
    const invalid = type(newGame(), "ㄱㅏㄴㅁㄹㅏㄱ");
    expect(submitGuess(invalid)).toEqual({ state: invalid, error: "invalid" });
  });

  it("받은 줄은 기록되고 입력 줄이 비워지며, 같은 단어도 다시 받는다", () => {
    const once = submitGuess(type(newGame(), "ㅅㅏㅇㅓㅂㄱㅏ")).state;
    const twice = submitGuess(type(once, "ㅅㅏㅇㅓㅂㄱㅏ"));
    expect(twice.error).toBeNull();
    expect(twice.state.guesses).toHaveLength(2);
    expect(twice.state.current).toEqual([]);
  });

  it("정답을 맞히면 성공이고, 이후 입력·삭제·제출을 모두 무시한다", () => {
    const won = submitGuess(type(newGame(), "ㄱㅏㅇㅇㅏㅈㅣ")).state;
    expect(statusOf(won)).toBe("won");
    expect(typeJamo(won, ["ㄱ"])).toBe(won);
    expect(submitGuess(won)).toEqual({ state: won, error: null });
  });

  it("8번째 줄까지 못 맞히면 실패", () => {
    const seven = newGame(Array(7).fill("ㅅㅏㅇㅓㅂㄱㅏ"));
    expect(statusOf(seven)).toBe("playing");
    expect(statusOf(submitGuess(type(seven, "ㅅㅏㅇㅓㅂㄱㅏ")).state)).toBe("lost");
  });

  it("8번째 줄에서 맞히면 실패가 아니라 성공", () => {
    expect(statusOf(newGame([...Array(7).fill("ㅅㅏㅇㅓㅂㄱㅏ"), "ㄱㅏㅇㅇㅏㅈㅣ"]))).toBe("won");
  });
});
