import { deserialize, EMPTY_DATA, serialize, STORAGE_KEY, type SavedData } from "@/lib/wordle/saved";

// 저장소가 차단됐거나 시크릿 모드면 localStorage 접근 자체가 예외를 던진다. 그때는 저장 없이 진행한다

export function loadSaved(): SavedData {
  try {
    return deserialize(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_DATA;
  }
}

export function storeSaved(data: SavedData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, serialize(data));
  } catch {
    // 저장하지 못해도 게임은 계속한다
  }
}
