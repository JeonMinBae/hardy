const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** onUpdate 는 0 → 1 진행도를 받는다. 마지막 호출은 항상 1 이다 */
export function tween(ms: number, onUpdate: (progress: number) => void): Promise<void> {
  if (ms <= 0) {
    onUpdate(1);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      onUpdate(easeOut(t));
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}
