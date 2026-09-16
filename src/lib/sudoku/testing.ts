import type { Grid } from "./types";

// 해가 하나인 잘 알려진 퍼즐(주어진 칸 30개)과 그 해. 0행: 5 3 _ _ 7 _ _ _ _
export const SAMPLE_PUZZLE =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
export const SAMPLE_SOLUTION =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

export const parseGrid = (text: string): Grid => [...text].map(Number);

export function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
