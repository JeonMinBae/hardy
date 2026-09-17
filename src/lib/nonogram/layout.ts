/** 확대 상태의 칸 크기이자 맞춤 상태 칸 크기의 상한(px) */
export const MAX_CELL = 36;
/** 단서 숫자 하나가 차지하는 폭(행 단서)·높이(열 단서)의 칸 크기 대비 비율 */
const CLUE_RATIO = 0.9;

/** 한 줄 단서 숫자 개수의 최대값 */
export const clueDepth = (clues: readonly (readonly number[])[]) => Math.max(...clues.map((clue) => clue.length));

export const clueSlot = (cell: number) => Math.floor(cell * CLUE_RATIO);

/** 행 단서 영역을 포함한 판이 width 에 들어가는 칸 크기. 1px 이상 MAX_CELL 이하 */
export function fitCellSize(width: number, size: number, rowClueDepth: number): number {
  return Math.max(1, Math.min(MAX_CELL, Math.floor(width / (size + CLUE_RATIO * rowClueDepth))));
}
