import { describe, expect, it } from "vitest";
import { dragMove } from "./drag";
import { faceMove } from "./notation";

describe("dragMove", () => {
  it("앞면 오른쪽 줄을 위로 끌면 R", () => {
    expect(dragMove([0, 0, 1], [0, 1, 0], [2, -2, 2], 3)).toEqual(faceMove("R", false, 3));
  });

  it("윗면 앞줄을 왼쪽으로 끌면 F′", () => {
    expect(dragMove([0, 1, 0], [-1, 0, 0], [0, 2, 2], 3)).toEqual(faceMove("F", true, 3));
  });

  it("3×3 가운데 열을 끌면 가운데 층", () => {
    expect(dragMove([0, 0, 1], [0, -1, 0], [0, 0, 2], 3)).toEqual({ axis: 0, layer: 1, turns: 1 });
  });

  it("2×2 좌표에서도 층 번호가 맞다", () => {
    expect(dragMove([0, 0, 1], [0, 1, 0], [1, 1, 1], 2)).toEqual(faceMove("R", false, 2));
  });

  it("법선과 평행하면 null", () => {
    expect(dragMove([0, 0, 1], [0, 0, -1], [0, 0, 2], 3)).toBeNull();
  });
});
