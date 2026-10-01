import { describe, expect, it } from "vitest";
import { applyMoves, invertMove, isSolved, type Move } from "./cube";
import { createGame, cubeOf, giveUp, simplify, solutionMoves, turn, undo } from "./game";
import { faceMove } from "./notation";

const R = faceMove("R", false, 3);
const U = faceMove("U", false, 3);
const fresh = () => createGame(3, [R]);

describe("turn / undo", () => {
  it("맞추는 회전이면 solved", () => {
    const game = turn(fresh(), invertMove(R));
    expect(game).toMatchObject({ status: "solved", moveCount: 1 });
  });

  it("되돌리기는 history 를 줄이고 이동 수는 늘린다", () => {
    const game = undo(turn(fresh(), U));
    expect(game.history).toEqual([]);
    expect(game.moveCount).toBe(2);
  });

  it("되돌릴 게 없으면 그대로", () => {
    const game = fresh();
    expect(undo(game)).toBe(game);
  });

  it("끝난 게임은 회전·되돌리기·포기를 무시한다", () => {
    const solved = turn(fresh(), invertMove(R));
    expect(turn(solved, U)).toBe(solved);
    expect(undo(solved)).toBe(solved);
    expect(giveUp(solved)).toBe(solved);
  });
});

describe("createGame", () => {
  it("저장된 history 로 이미 맞춰졌으면 solved 로 복원", () => {
    expect(createGame(3, [R], [invertMove(R)], 5)).toMatchObject({ status: "solved", moveCount: 5 });
  });
});

describe("simplify", () => {
  const L0 = (turns: 1 | -1): Move => ({ axis: 0, layer: 0, turns });
  it.each<[string, Move[], Move[]]>([
    ["상쇄", [L0(1), L0(-1)], []],
    ["세 번 같은 방향은 반대 한 번", [L0(1), L0(1), L0(1)], [L0(-1)]],
    ["반 바퀴는 두 번", [L0(-1), L0(-1)], [L0(1), L0(1)]],
    ["사이가 지워지면 앞뒤가 이어서 합쳐진다", [L0(1), U, invertMove(U), L0(1)], [L0(1), L0(1)]],
  ])("%s", (_, input, output) => {
    expect(simplify(input)).toEqual(output);
  });
});

describe("solutionMoves", () => {
  it("적용하면 완성이고 사용자가 낸 상쇄 회전은 재생하지 않는다", () => {
    let game = createGame(3, [R, U, R]);
    game = turn(turn(game, U), invertMove(U));
    const moves = solutionMoves(game);
    expect(isSolved(applyMoves(cubeOf(game), moves))).toBe(true);
    expect(moves.length).toBeLessThanOrEqual(3);
  });
});
