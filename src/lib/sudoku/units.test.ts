import { describe, expect, it } from "vitest";
import { DIAGONAL_CELLS, getPeers, getUnits } from "./units";

describe("units", () => {
  it("일반 27개, X 29개 단위", () => {
    expect(getUnits("normal")).toHaveLength(27);
    expect(getUnits("x")).toHaveLength(29);
  });

  it("대각선 칸은 가운데가 겹쳐 17칸", () => {
    expect(DIAGONAL_CELLS.size).toBe(17);
    expect(DIAGONAL_CELLS.has(40)).toBe(true);
  });

  it("피어 수: 일반 20, X 가운데 32, X 모서리 26, X 대각선 밖 20", () => {
    expect(getPeers("normal")[40]).toHaveLength(20);
    expect(getPeers("x")[40]).toHaveLength(32);
    expect(getPeers("x")[0]).toHaveLength(26);
    expect(getPeers("x")[1]).toHaveLength(20);
  });
});
