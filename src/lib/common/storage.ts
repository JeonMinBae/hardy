// 저장소가 차단됐거나 시크릿 모드면 localStorage 접근 자체가 예외를 던진다. 그때는 저장 없이 진행한다

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 저장하지 못해도 게임은 계속한다
  }
}
