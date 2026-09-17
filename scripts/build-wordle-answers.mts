// 워들 정답 목록(src/lib/wordle/answers.json)을 만든다: node scripts/build-wordle-answers.mts
// 원본: 국립국어원 「한국어 학습용 어휘 목록」 txt(EUC-KR, 탭 구분: 순위·단어·품사·풀이·등급)
import { readFileSync, writeFileSync } from "node:fs";
import { decompose } from "../src/lib/wordle/jamo.ts";

const SOURCE = new URL("./data/learner-vocabulary.txt", import.meta.url);
const OUTPUT = new URL("../src/lib/wordle/answers.json", import.meta.url);
// 출제 순서를 정하는 시드. 바꾸면 이미 나간 번호의 정답이 달라진다
const SEED = 20260917;

// 스도쿠의 mulberry32·shuffle 과 공유하지 않는다. 그쪽이 바뀌어도 출제 순서가 바뀌면 안 된다
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const text = new TextDecoder("euc-kr").decode(readFileSync(SOURCE));
const wordByJamo = new Map<string, string>();
for (const line of text.split(/\r?\n/).slice(1)) {
  const [, headword, partOfSpeech] = line.split("\t");
  if (partOfSpeech !== "명") continue;
  // 표제어 끝의 숫자는 동음이의 번호다(가격03)
  const word = headword.replace(/\d+$/, "");
  const jamo = decompose(word);
  if (jamo?.length !== 6) continue;
  const key = jamo.join("");
  if (!wordByJamo.has(key)) wordByJamo.set(key, word);
}

const words = [...wordByJamo.values()];
const random = mulberry32(SEED);
for (let i = words.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [words[i], words[j]] = [words[j], words[i]];
}
writeFileSync(OUTPUT, `${JSON.stringify(words, null, 2)}\n`);
console.log(`정답 ${words.length}개를 썼습니다`);
