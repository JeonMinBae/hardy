import { afterEach, describe, expect, it, vi } from "vitest";
import { readStorage, writeStorage } from "./storage";

const stubStorage = (localStorage: Partial<Storage>) => vi.stubGlobal("window", { localStorage });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readStorage / writeStorage", () => {
  it("저장소가 있으면 그대로 읽고 쓴다", () => {
    const data = new Map<string, string>();
    stubStorage({ getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) });
    writeStorage("k", "v");
    expect(readStorage("k")).toBe("v");
    expect(readStorage("none")).toBeNull();
  });

  it("접근이 예외를 던지면 읽기는 null, 쓰기는 조용히 무시한다", () => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    stubStorage({ getItem: blocked, setItem: blocked });
    expect(readStorage("k")).toBeNull();
    expect(() => writeStorage("k", "v")).not.toThrow();
  });

  it("window 자체가 없어도(서버 렌더) 예외 없이 null", () => {
    vi.stubGlobal("window", undefined);
    expect(readStorage("k")).toBeNull();
    expect(() => writeStorage("k", "v")).not.toThrow();
  });
});
