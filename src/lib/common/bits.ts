/** URL 상태 저장용 비트 단위 쓰기. 큰 자리 비트부터 쓴다 */
export class BitWriter {
  private bytes: number[] = [];
  private length = 0;

  write(value: number, bits: number) {
    for (let b = bits - 1; b >= 0; b--) {
      if (this.length % 8 === 0) this.bytes.push(0);
      if ((value >> b) & 1) this.bytes[this.bytes.length - 1] |= 0x80 >> (this.length % 8);
      this.length++;
    }
  }

  toBytes(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

export class BitReader {
  private position = 0;
  constructor(private readonly bytes: Uint8Array) {}

  private bitAt(p: number): number {
    return (this.bytes[p >> 3] >> (7 - (p % 8))) & 1;
  }

  /** 남은 비트가 모자라면 RangeError 를 던진다 */
  read(bits: number): number {
    if (this.position + bits > this.bytes.length * 8) throw new RangeError("비트 부족");
    let value = 0;
    for (let i = 0; i < bits; i++) value = (value << 1) | this.bitAt(this.position++);
    return value;
  }

  /** 읽은 뒤 남은 것이 마지막 바이트의 0 패딩뿐인지 */
  isAtPaddedEnd(): boolean {
    if (this.bytes.length !== Math.ceil(this.position / 8)) return false;
    for (let p = this.position; p < this.bytes.length * 8; p++) if (this.bitAt(p)) return false;
    return true;
  }
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text: string): Uint8Array | null {
  // 패딩 없는 base64url 만 받는다. 길이 % 4 === 1 은 어떤 바이트열에서도 나오지 않는다
  if (!/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1) return null;
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  } catch {
    return null;
  }
}
