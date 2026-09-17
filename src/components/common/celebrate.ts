export async function celebrate() {
  const { default: confetti } = await import("canvas-confetti");
  await confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 }, disableForReducedMotion: true });
}
