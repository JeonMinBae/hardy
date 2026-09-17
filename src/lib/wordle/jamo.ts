// scripts/build-wordle-answers.mts 가 Node 로 직접 읽는다. import 를 두려면 .ts 확장자까지 적어야 한다
export const CONSONANTS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] as const;
export const VOWELS = ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"] as const;

const JAMO = new Set<string>([...CONSONANTS, ...VOWELS]);
const VOWEL_SET = new Set<string>(VOWELS);

// 배열 순서가 곧 유니코드 인덱스다: 음절 = 0xAC00 + (초성 × 21 + 중성) × 28 + 종성
const CHOSEONG = ["ㄱ", "ㄱㄱ", "ㄴ", "ㄷ", "ㄷㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅂㅂ", "ㅅ", "ㅅㅅ", "ㅇ", "ㅈ", "ㅈㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNGSEONG = ["ㅏ", "ㅏㅣ", "ㅑ", "ㅑㅣ", "ㅓ", "ㅓㅣ", "ㅕ", "ㅕㅣ", "ㅗ", "ㅗㅏ", "ㅗㅏㅣ", "ㅗㅣ", "ㅛ", "ㅜ", "ㅜㅓ", "ㅜㅓㅣ", "ㅜㅣ", "ㅠ", "ㅡ", "ㅡㅣ", "ㅣ"];
const JONGSEONG = ["", "ㄱ", "ㄱㄱ", "ㄱㅅ", "ㄴ", "ㄴㅈ", "ㄴㅎ", "ㄷ", "ㄹ", "ㄹㄱ", "ㄹㅁ", "ㄹㅂ", "ㄹㅅ", "ㄹㅌ", "ㄹㅍ", "ㄹㅎ", "ㅁ", "ㅂ", "ㅂㅅ", "ㅅ", "ㅅㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const SYLLABLE_BASE = 0xac00;
const SYLLABLE_COUNT = 11172;

export const isJamo = (value: string) => JAMO.has(value);

/** 한글 음절로만 된 단어를 기본 자모 24종의 배열로 쪼갠다. 음절이 아닌 글자가 있으면 null */
export function decompose(word: string): string[] | null {
  const jamo: string[] = [];
  for (const char of word) {
    const index = char.codePointAt(0)! - SYLLABLE_BASE;
    if (index < 0 || index >= SYLLABLE_COUNT) return null;
    jamo.push(...CHOSEONG[Math.floor(index / 588)], ...JUNGSEONG[Math.floor(index / 28) % 21], ...JONGSEONG[index % 28]);
  }
  return jamo;
}

interface Syllable {
  cho: number;
  jung: number;
  jong: number;
}

/** 자모 배열을 음절열로 조합한다. 조합할 수 없으면 null */
export function compose(jamo: readonly string[]): string | null {
  // 자음끼리, 모음끼리 연속한 묶음으로 나눈다
  const runs: string[] = [];
  jamo.forEach((j, i) => {
    if (i > 0 && VOWEL_SET.has(j) === VOWEL_SET.has(jamo[i - 1])) runs[runs.length - 1] += j;
    else runs.push(j);
  });
  if (runs.length === 0 || VOWEL_SET.has(runs[0][0])) return null;

  const syllables: Syllable[] = [];
  for (let r = 0; r < runs.length; r++) {
    const run = runs[r];
    if (VOWEL_SET.has(run[0])) {
      // 음절은 모음으로 시작할 수 없으므로 연속한 모음은 모두 한 중성이어야 한다
      const jung = JUNGSEONG.indexOf(run);
      if (jung < 0) return null;
      syllables[syllables.length - 1].jung = jung;
    } else if (r === 0) {
      const cho = CHOSEONG.indexOf(run);
      if (cho < 0) return null;
      syllables.push({ cho, jung: -1, jong: 0 });
    } else if (r === runs.length - 1) {
      const jong = JONGSEONG.indexOf(run);
      if (jong < 0) return null;
      syllables[syllables.length - 1].jong = jong;
    } else {
      // 모음 사이 자음은 뒤 음절 초성을 쌍자음(두 자모) → 한 자모 순으로 먼저 채우고 나머지를 앞 음절 종성으로 둔다
      const split = [2, 1]
        .filter((length) => length <= run.length)
        .map((length) => ({ jong: JONGSEONG.indexOf(run.slice(0, -length)), cho: CHOSEONG.indexOf(run.slice(-length)) }))
        .find(({ jong, cho }) => jong >= 0 && cho >= 0);
      if (!split) return null;
      syllables[syllables.length - 1].jong = split.jong;
      syllables.push({ cho: split.cho, jung: -1, jong: 0 });
    }
  }
  // 자음만 있으면 중성이 없는 음절이 남는다
  if (syllables.some((s) => s.jung < 0)) return null;
  return String.fromCodePoint(...syllables.map((s) => SYLLABLE_BASE + (s.cho * 21 + s.jung) * 28 + s.jong));
}
