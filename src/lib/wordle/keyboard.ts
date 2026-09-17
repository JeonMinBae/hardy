export type KeyboardKey = string;
export const ENTER_KEY = "enter";
export const DELETE_KEY = "delete";

/** 화면 키보드 배열(두벌식 순서, 쌍자음·ㅐ·ㅔ 키 없음) */
export const KEYBOARD_ROWS: readonly (readonly KeyboardKey[])[] = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  [ENTER_KEY, "ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ", DELETE_KEY],
];

// 두벌식 자판의 물리 키 위치. ㅐ·ㅔ·쌍자음은 기본 자모 여러 개로 넣는다
const KEYS: Record<string, string> = {
  KeyQ: "ㅂ", KeyW: "ㅈ", KeyE: "ㄷ", KeyR: "ㄱ", KeyT: "ㅅ", KeyY: "ㅛ", KeyU: "ㅕ", KeyI: "ㅑ", KeyO: "ㅏㅣ", KeyP: "ㅓㅣ",
  KeyA: "ㅁ", KeyS: "ㄴ", KeyD: "ㅇ", KeyF: "ㄹ", KeyG: "ㅎ", KeyH: "ㅗ", KeyJ: "ㅓ", KeyK: "ㅏ", KeyL: "ㅣ",
  KeyZ: "ㅋ", KeyX: "ㅌ", KeyC: "ㅊ", KeyV: "ㅍ", KeyB: "ㅠ", KeyN: "ㅜ", KeyM: "ㅡ",
};
const SHIFT_KEYS: Record<string, string> = { KeyQ: "ㅂㅂ", KeyW: "ㅈㅈ", KeyE: "ㄷㄷ", KeyR: "ㄱㄱ", KeyT: "ㅅㅅ", KeyO: "ㅑㅣ", KeyP: "ㅕㅣ" };

/** 한/영 상태와 무관하게 KeyboardEvent.code 로 자모를 정한다. 자모 키가 아니면 null */
export function jamoForKey(code: string, shift: boolean): string[] | null {
  const jamo = (shift ? SHIFT_KEYS[code] : undefined) ?? KEYS[code];
  return jamo ? [...jamo] : null;
}
