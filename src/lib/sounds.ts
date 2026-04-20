"use client";

// Programmatic sounds via Web Audio API — no audio files required.

type OscType = "sine" | "square" | "sawtooth" | "triangle";

function tone(
  freq: number,
  startAt: number,
  duration: number,
  volume: number,
  type: OscType,
  ctx: AudioContext
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime + startAt);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + startAt + duration
  );
  osc.start(ctx.currentTime + startAt);
  osc.stop(ctx.currentTime + startAt + duration + 0.01);
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  return new AudioContext();
}

// Short high click — one team checked in
export function playReadyOne() {
  const ctx = getCtx();
  if (!ctx) return;
  tone(880, 0, 0.12, 0.25, "sine", ctx);
  tone(1100, 0.07, 0.1, 0.18, "sine", ctx);
}

// Ascending chime — both teams ready, veto starts
export function playReadyBoth() {
  const ctx = getCtx();
  if (!ctx) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => tone(f, i * 0.1, 0.2, 0.22, "sine", ctx));
}

// Sharp click — map vetoed
export function playVeto() {
  const ctx = getCtx();
  if (!ctx) return;
  tone(200, 0, 0.06, 0.3, "square", ctx);
  tone(120, 0.03, 0.1, 0.2, "sine", ctx);
}

// Fanfare — veto complete, server provisioning starts
export function playVetoDone() {
  const ctx = getCtx();
  if (!ctx) return;
  const seq = [
    [523, 0, 0.15],
    [659, 0.12, 0.15],
    [784, 0.24, 0.15],
    [1047, 0.36, 0.35],
  ] as const;
  seq.forEach(([f, t, d]) => tone(f, t, d, 0.2, "sine", ctx));
}

// Rising sweep — server ready, connect info unlocked
export function playServerReady() {
  const ctx = getCtx();
  if (!ctx) return;
  const notes = [392, 494, 587, 740, 988, 1174] as const;
  notes.forEach((f, i) => tone(f, i * 0.07, 0.22, 0.18, "sine", ctx));
}
