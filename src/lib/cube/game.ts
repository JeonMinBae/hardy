import { applyMoves, invertMove, isSolved, solvedCube, type CubeSize, type CubeState, type Move } from "./cube";

export type CubeStatus = "playing" | "solved" | "gaveUp";

export interface CubeGame {
  size: CubeSize;
  scramble: readonly Move[];
  /** 섞은 뒤 적용된 회전. 되돌리면 빠진다 */
  history: readonly Move[];
  /** 층 회전 + 되돌리기 횟수 */
  moveCount: number;
  status: CubeStatus;
}

export const cubeOf = (game: Pick<CubeGame, "size" | "scramble" | "history">): CubeState =>
  applyMoves(solvedCube(game.size), [...game.scramble, ...game.history]);

/** 저장된 진행을 복원할 때도 쓴다. 이미 맞춰진 상태면 solved 로 시작한다 */
export function createGame(size: CubeSize, scramble: readonly Move[], history: readonly Move[] = [], moveCount = history.length): CubeGame {
  const status: CubeStatus = history.length > 0 && isSolved(cubeOf({ size, scramble, history })) ? "solved" : "playing";
  return { size, scramble, history, moveCount, status };
}

const settle = (game: CubeGame): CubeGame => (isSolved(cubeOf(game)) ? { ...game, status: "solved" } : game);

export function turn(game: CubeGame, move: Move): CubeGame {
  if (game.status !== "playing") return game;
  return settle({ ...game, history: [...game.history, move], moveCount: game.moveCount + 1 });
}

export function undo(game: CubeGame): CubeGame {
  if (game.status !== "playing" || game.history.length === 0) return game;
  return settle({ ...game, history: game.history.slice(0, -1), moveCount: game.moveCount + 1 });
}

export const giveUp = (game: CubeGame): CubeGame => (game.status === "playing" ? { ...game, status: "gaveUp" } : game);

/** 되돌리기로 화면에 재생할 회전. 마지막 history 의 역회전이다 */
export const undoMove = (game: CubeGame): Move | null => (game.history.length === 0 ? null : invertMove(game.history.at(-1)!));

/** 같은 축·층이 이어지면 합치고 0 이 되면 지운다. 반 바퀴는 같은 방향 90° 두 번으로 남긴다 */
export function simplify(moves: readonly Move[]): Move[] {
  const stack: { axis: Move["axis"]; layer: number; quarter: number }[] = [];
  for (const { axis, layer, turns } of moves) {
    const last = stack.at(-1);
    if (last && last.axis === axis && last.layer === layer) {
      last.quarter = (last.quarter + turns + 4) % 4;
      if (last.quarter === 0) stack.pop();
    } else {
      stack.push({ axis, layer, quarter: (turns + 4) % 4 });
    }
  }
  return stack.flatMap<Move>(({ axis, layer, quarter }) =>
    quarter === 3 ? [{ axis, layer, turns: -1 as const }] : Array.from({ length: quarter }, () => ({ axis, layer, turns: 1 as const })),
  );
}

/** 포기 시 재생할 회전. 섞기와 history 전체를 거꾸로 되돌린다 */
export const solutionMoves = (game: CubeGame): Move[] => simplify([...game.scramble, ...game.history].reverse().map(invertMove));
