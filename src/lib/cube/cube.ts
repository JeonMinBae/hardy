export type CubeSize = 2 | 3;
export const CUBE_SIZES: readonly CubeSize[] = [2, 3];
/** 0 = x(오른쪽), 1 = y(위), 2 = z(앞) */
export type Axis = 0 | 1 | 2;
export type Vec3 = readonly [number, number, number];

/** axis 둘레 오른손 법칙 +90° 가 turns = 1 이다. layer 는 축 음수 쪽부터 0 */
export interface Move {
  axis: Axis;
  layer: number;
  turns: 1 | -1;
}

/** 색 번호. 법선이 이 면을 향한 스티커가 맞춘 상태의 색이다 */
export const FACES = ["U", "R", "F", "D", "L", "B"] as const;
export type Face = (typeof FACES)[number];
export const FACE_NORMAL: Record<Face, Vec3> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

/** pos 는 스티커가 붙은 조각의 중심. 크기 N 에서 각 성분은 -(N-1) … N-1 사이 2 간격 정수다 */
export interface Sticker {
  pos: Vec3;
  normal: Vec3;
  color: number;
}

export interface CubeState {
  size: CubeSize;
  stickers: readonly Sticker[];
}

export const layerOf = (coord: number, size: CubeSize) => (coord + size - 1) / 2;

// +90°: x축 (x,y,z)→(x,-z,y), y축 (z,y,-x), z축 (-y,x,z). -90° 는 그 역
export function rotateVec([x, y, z]: Vec3, axis: Axis, turns: 1 | -1): Vec3 {
  if (axis === 0) return turns === 1 ? [x, -z, y] : [x, z, -y];
  if (axis === 1) return turns === 1 ? [z, y, -x] : [-z, y, x];
  return turns === 1 ? [-y, x, z] : [y, -x, z];
}

export function solvedCube(size: CubeSize): CubeState {
  const max = size - 1;
  const coords = Array.from({ length: size }, (_, i) => -max + 2 * i);
  const stickers: Sticker[] = [];
  for (const x of coords)
    for (const y of coords)
      for (const z of coords) {
        FACES.forEach((face, color) => {
          const normal = FACE_NORMAL[face];
          const axis = normal.findIndex((n) => n !== 0);
          if ([x, y, z][axis] === normal[axis] * max) stickers.push({ pos: [x, y, z], normal, color });
        });
      }
  return { size, stickers };
}

export function applyMove(state: CubeState, { axis, layer, turns }: Move): CubeState {
  const stickers = state.stickers.map((s) =>
    layerOf(s.pos[axis], state.size) === layer
      ? {
          ...s,
          pos: rotateVec(s.pos, axis, turns),
          normal: rotateVec(s.normal, axis, turns),
        }
      : s,
  );
  return { size: state.size, stickers };
}

export const applyMoves = (state: CubeState, moves: readonly Move[]) => moves.reduce(applyMove, state);

export const invertMove = (move: Move): Move => ({
  ...move,
  turns: move.turns === 1 ? -1 : 1,
});

/** 바깥 법선이 같은 스티커끼리 색이 하나면 완성. 큐브 전체 방향은 따지지 않는다 */
export function isSolved({ stickers }: CubeState): boolean {
  const colorByNormal = new Map<string, number>();
  for (const { normal, color } of stickers) {
    const key = normal.join(",");
    const seen = colorByNormal.get(key);
    if (seen === undefined) colorByNormal.set(key, color);
    else if (seen !== color) return false;
  }
  return true;
}
