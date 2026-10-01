import { FACE_NORMAL, type CubeSize, type Face, type Move } from "./cube";

export const NOTATION_FACES: readonly Face[] = ["R", "L", "U", "D", "F", "B"];

/** 그 면을 정면으로 봤을 때 시계 방향 = 바깥 법선 둘레 -90° */
export function faceMove(face: Face, prime: boolean, size: CubeSize): Move {
  const normal = FACE_NORMAL[face];
  const axis = normal.findIndex((n) => n !== 0) as 0 | 1 | 2;
  const positive = normal[axis] > 0;
  const clockwise: 1 | -1 = positive ? -1 : 1;
  return { axis, layer: positive ? size - 1 : 0, turns: prime ? (-clockwise as 1 | -1) : clockwise };
}

/** KeyboardEvent.code 기준이라 한글 입력 상태에서도 동작한다. 해당 없으면 null */
export function keyToMove(code: string, shift: boolean, size: CubeSize): Move | null {
  const face = /^Key([RLUDFB])$/.exec(code)?.[1] as Face | undefined;
  return face ? faceMove(face, shift, size) : null;
}
