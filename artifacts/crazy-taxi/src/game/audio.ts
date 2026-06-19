// Procedural audio engine — all sounds synthesized via Web Audio API

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

// Engine nodes
let engineOsc: OscillatorNode | null = null;
let engineOsc2: OscillatorNode | null = null;
let engineFilter: BiquadFilterNode | null = null;
let engineGain: GainNode | null = null;

// Music state
let musicNodes: AudioNode[] = [];
let musicScheduler: ReturnType<typeof setTimeout> | null = null;
let musicPlaying = false;
let currentMusicType: "menu" | "game" | null = null;

export function initAudio() {
  if (ctx) return;
  ctx = new AudioContext();

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.55; // overall volume

  musicGain = ctx.createGain();
  musicGain.gain.value = 0.28; // music quieter

  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.75;

  musicGain.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.connect(ctx.destination);
}

function ensureCtx() {
  if (!ctx) initAudio();
  if (ctx!.state === "suspended") ctx!.resume();
  return ctx!;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function playTone(
  freq: number,
  type: OscillatorType,
  start: number,
  duration: number,
  gainPeak: number,
  attackTime = 0.01,
  releaseTime = 0.06,
  destination?: AudioNode
) {
  const c = ensureCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(destination ?? sfxGain!);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gainPeak, start + attackTime);
  g.gain.setValueAtTime(gainPeak, start + duration - releaseTime);
  g.gain.linearRampToValueAtTime(0, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.01);
}

function playNoise(
  start: number,
  duration: number,
  gainPeak: number,
  lowFreq = 100,
  highFreq = 8000,
  destination?: AudioNode
) {
  const c = ensureCtx();
  const bufLen = Math.ceil(c.sampleRate * (duration + 0.05));
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = (lowFreq + highFreq) / 2;
  filter.Q.value = 0.6;

  const g = c.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gainPeak, start + 0.008);
  g.gain.linearRampToValueAtTime(0, start + duration);

  src.connect(filter);
  filter.connect(g);
  g.connect(destination ?? sfxGain!);
  src.start(start);
  src.stop(start + duration + 0.01);
}

// ─── SOUND EFFECTS ───────────────────────────────────────────────────────────

// ── PASSENGER GREET CLIP ─────────────────────────────────────────────────────
let _greetAudio: HTMLAudioElement | null = null;

export function playPassengerGreet() {
  if (!_greetAudio) {
    _greetAudio = new Audio("/models/passenger_greet.mp3");
    _greetAudio.volume = 0.9;
  }
  _greetAudio.currentTime = 0;
  _greetAudio.play().catch(() => {});
}

export function playPickup() {
  const c = ensureCtx();
  const now = c.currentTime;
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => playTone(f, "sine", now + i * 0.08, 0.2, 0.35, 0.005, 0.1));
}

export function playDropoff() {
  const c = ensureCtx();
  const now = c.currentTime;
  [880, 1108, 1320, 1760].forEach((f, i) =>
    playTone(f, "sine", now + i * 0.09, 0.22, 0.4, 0.005, 0.12)
  );
  playTone(110, "triangle", now, 0.15, 0.25, 0.005, 0.1);
}

export function playHonk() {
  const c = ensureCtx();
  const now = c.currentTime;
  playTone(370, "sine", now, 0.12, 0.35, 0.01, 0.06);
  playTone(440, "sine", now + 0.13, 0.18, 0.4, 0.01, 0.08);
}

export function playGatorRoar() {
  const c = ensureCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.5);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.4, now + 0.05);
  g.gain.linearRampToValueAtTime(0, now + 0.5);
  osc.connect(g);
  g.connect(sfxGain!);
  osc.start(now);
  osc.stop(now + 0.55);
  playNoise(now, 0.4, 0.15, 80, 600);
}

export function playScreech() {
  const c = ensureCtx();
  const now = c.currentTime;
  // softer, shorter screech
  playNoise(now, 0.22, 0.28, 700, 3500);
}

export function playDriftScreech(intensity: number) {
  const c = ensureCtx();
  const now = c.currentTime;
  // Drift screech varies with intensity - higher pitch and longer for more intense drifts
  const baseDuration = 0.15 + Math.min(intensity * 0.2, 0.3); // 0.15 to 0.45 seconds
  const baseFrequency = 800 + intensity * 400; // 800Hz to 2000Hz+
  const noiseHighFreq = 3000 + intensity * 2000; // 3000 to 8000 Hz

  // Play a tone with noise for metallic screech sound
  playTone(baseFrequency, "sine", now, baseDuration * 0.7, 0.25, 0.01, 0.05);
  playNoise(now, baseDuration, 0.2 + intensity * 0.15, 500, noiseHighFreq);
}

export function playTimerBeep(urgency: number) {
  const c = ensureCtx();
  const now = c.currentTime;
  const freq = 660 + urgency * 160;
  playTone(freq, "sine", now, 0.06, 0.28, 0.005, 0.03);
}

export function playGameOver() {
  const c = ensureCtx();
  const now = c.currentTime;
  const notes = [392, 349, 311, 261];
  notes.forEach((f, i) => {
    playTone(f, "triangle", now + i * 0.22, 0.35, 0.35, 0.01, 0.15);
  });
}

export function playHighScore() {
  const c = ensureCtx();
  const now = c.currentTime;
  const notes = [523, 659, 784, 659, 784, 1047];
  notes.forEach((f, i) => playTone(f, "sine", now + i * 0.1, 0.18, 0.5, 0.005, 0.08));
}

export function playPerfectDriftSound() {
  const c = ensureCtx();
  const now = c.currentTime;
  // Rising arpeggio with bright, celebratory tone
  const notes = [659, 784, 1047, 1318]; // E5, G5, C6, E6
  notes.forEach((f, i) => {
    playTone(f, "sine", now + i * 0.05, 0.15, 0.4, 0.005, 0.05);
  });
  // Add a noise burst for impact
  playNoise(now + 0.2, 0.1, 0.3, 2000, 8000);
}

export function playDriftStreakSound() {
  const c = ensureCtx();
  const now = c.currentTime;
  // Double hit with descending pitch - indicates chaining
  const notes = [880, 659]; // A5, E5
  notes.forEach((f, i) => {
    playTone(f, "sine", now + i * 0.1, 0.12, 0.25, 0.005, 0.05);
  });
  // Add subtle noise texture
  playNoise(now, 0.15, 0.2, 1000, 4000);
}

/** Collision thud — low impact bump */
export function playCollision() {
  const c = ensureCtx();
  const now = c.currentTime;
  // Low thud
  playTone(65, "sine", now, 0.22, 0.45, 0.003, 0.14);
  playTone(48, "triangle", now + 0.02, 0.2, 0.3, 0.005, 0.12);
  // Impact noise burst
  playNoise(now, 0.12, 0.38, 100, 1200);
  // High crack
  playNoise(now + 0.01, 0.06, 0.18, 2000, 6000);
}

export function playEngineStart() {
  const c = ensureCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(55, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.7);
  osc.frequency.exponentialRampToValueAtTime(85, now + 1.3);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.25, now + 0.12);
  g.gain.linearRampToValueAtTime(0.15, now + 1.3);
  g.gain.linearRampToValueAtTime(0, now + 1.7);
  osc.connect(g);
  g.connect(sfxGain!);
  osc.start(now);
  osc.stop(now + 1.8);
}

// ─── CONTINUOUS ENGINE HUM ────────────────────────────────────────────────────
// Gentle sine-based hum — much less harsh than a distorted sawtooth

export function startEngine() {
  if (engineOsc) return;
  const c = ensureCtx();

  // Low-pass filter to keep it warm and muffled
  engineFilter = c.createBiquadFilter();
  engineFilter.type = "lowpass";
  engineFilter.frequency.value = 320;
  engineFilter.Q.value = 0.8;

  // Primary hum
  engineOsc = c.createOscillator();
  engineOsc.type = "sine";
  engineOsc.frequency.value = 72;

  // Very subtle second harmonic for texture
  engineOsc2 = c.createOscillator();
  engineOsc2.type = "triangle";
  engineOsc2.frequency.value = 144;

  engineGain = c.createGain();
  engineGain.gain.value = 0;

  const harmGain = c.createGain();
  harmGain.gain.value = 0.22; // quiet harmonic

  engineOsc.connect(engineFilter);
  engineOsc2.connect(harmGain);
  harmGain.connect(engineFilter);
  engineFilter.connect(engineGain);
  engineGain.connect(sfxGain!);

  engineOsc.start();
  engineOsc2.start();
}

export function updateEngine(speed: number, maxSpeed: number) {
  if (!engineOsc || !engineOsc2 || !engineGain || !engineFilter || !ctx) return;
  const n = Math.min(1, Math.abs(speed) / maxSpeed);
  const targetFreq = 68 + n * 72;          // 68–140 Hz
  const targetGain = 0.04 + n * 0.09;      // very subtle: 0.04–0.13
  const now = ctx.currentTime;
  engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.12);
  engineOsc2.frequency.setTargetAtTime(targetFreq * 2, now, 0.12);
  engineFilter.frequency.setTargetAtTime(200 + n * 250, now, 0.12);
  engineGain.gain.setTargetAtTime(targetGain, now, 0.1);
}

export function stopEngine() {
  if (!engineOsc || !engineGain || !ctx) return;
  const now = ctx.currentTime;
  engineGain.gain.linearRampToValueAtTime(0, now + 0.6);
  engineOsc.stop(now + 0.7);
  engineOsc2?.stop(now + 0.7);
  engineOsc = null;
  engineOsc2 = null;
  engineFilter = null;
  engineGain = null;
}

// ─── BACKGROUND MUSIC ────────────────────────────────────────────────────────

function stopMusicNodes() {
  if (musicScheduler) { clearTimeout(musicScheduler); musicScheduler = null; }
  musicNodes.forEach((n) => {
    try { (n as OscillatorNode | AudioBufferSourceNode).stop?.(); } catch {}
    n.disconnect();
  });
  musicNodes = [];
  musicPlaying = false;
  currentMusicType = null;
}

function musicNote(
  freq: number,
  type: OscillatorType,
  start: number,
  dur: number,
  vol: number,
  attack = 0.02
) {
  const c = ctx!;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + attack);
  g.gain.setValueAtTime(vol, start + dur - 0.05);
  g.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(g);
  g.connect(musicGain!);
  osc.start(start);
  osc.stop(start + dur + 0.02);
  musicNodes.push(osc);
}

function musicNoise(start: number, dur: number, vol: number, lowF: number, highF: number) {
  const c = ctx!;
  const bufLen = Math.ceil(c.sampleRate * (dur + 0.05));
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "highpass";
  filt.frequency.value = lowF;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, start);
  g.gain.linearRampToValueAtTime(0, start + dur);
  src.connect(filt);
  filt.connect(g);
  g.connect(musicGain!);
  src.start(start);
  src.stop(start + dur + 0.02);
  musicNodes.push(src);
}

// ── MENU MUSIC: gentle ambient groove ─────────────────────────────────────
// Slower tempo, sparse notes, warm pads — relaxed, not jarring

function scheduleMenuBar(barStart: number) {
  if (!musicPlaying || currentMusicType !== "menu") return;
  const c = ctx!;
  const bpm = 88;
  const beat = 60 / bpm;
  const bar = beat * 4;

  // Soft bass pulse on beats 1 & 3
  [0, 2].forEach((b) => {
    musicNote(55, "sine", barStart + b * beat, beat * 0.6, 0.22, 0.02);
  });

  // Warm pad chord — triangle waves, soft volume
  const pad = [220, 277, 330];
  pad.forEach((f) => musicNote(f, "triangle", barStart, bar * 0.92, 0.08, 0.12));

  // Subtle melody — every other bar feel (offset notes)
  const mel = [[440, 0], [494, beat * 1.5], [523, beat * 2.5], [494, beat * 3]];
  mel.forEach(([f, t]) => musicNote(f, "sine", barStart + t, beat * 0.4, 0.1, 0.02));

  // Light hi-hat only on beats (not 16ths)
  [0, 1, 2, 3].forEach((b) => {
    const vol = b % 2 === 0 ? 0.07 : 0.04;
    musicNoise(barStart + b * beat, 0.04, vol, 7000, 14000);
  });

  // Kick on beat 1 only
  musicNote(52, "sine", barStart, beat * 0.25, 0.28, 0.005);

  const nextBar = barStart + bar;
  const delay = (nextBar - c.currentTime) * 1000 - 40;
  musicScheduler = setTimeout(() => scheduleMenuBar(nextBar), Math.max(0, delay));
}

// ── GAME MUSIC: upbeat but not overwhelming ────────────────────────────────

const GAME_BASS = [55, 0, 73, 55, 0, 73, 82, 0];
const GAME_MEL: [number, number][] = [
  [523, 0], [659, 1.0], [784, 2.0], [659, 2.75], [523, 3.25],
];

function scheduleGameBar(barStart: number) {
  if (!musicPlaying || currentMusicType !== "game") return;
  const c = ctx!;
  const bpm = 118;
  const beat = 60 / bpm;
  const bar = beat * 4;

  // Bass line — moderate volume
  GAME_BASS.forEach((f, i) => {
    if (f > 0) musicNote(f, "triangle", barStart + i * (beat / 2), beat * 0.4, 0.25, 0.01);
  });

  // Simple melody — sine, quiet
  GAME_MEL.forEach(([f, t]) => {
    musicNote(f, "sine", barStart + t * beat, beat * 0.38, 0.12, 0.015);
  });

  // Kick on 1 and 3 — moderate
  [0, 2].forEach((b) => {
    musicNote(52, "sine", barStart + b * beat, beat * 0.28, 0.32, 0.005);
  });

  // Snare on 2 and 4 — softer noise
  [1, 3].forEach((b) => {
    musicNoise(barStart + b * beat, 0.1, 0.12, 1500, 6000);
  });

  // Hi-hat on quarter beats only (not 16ths — much less busy)
  [0, 1, 2, 3].forEach((b) => {
    musicNoise(barStart + b * beat, 0.035, 0.06, 8000, 16000);
  });

  // Single off-beat accent chord
  const accent = [220, 277, 330];
  accent.forEach((f) =>
    musicNote(f, "triangle", barStart + beat * 0.5, beat * 0.2, 0.07, 0.01)
  );

  const nextBar = barStart + bar;
  const delay = (nextBar - c.currentTime) * 1000 - 40;
  musicScheduler = setTimeout(() => scheduleGameBar(nextBar), Math.max(0, delay));
}

export function playMenuMusic() {
  ensureCtx();
  if (currentMusicType === "menu") return;
  stopMusicNodes();
  musicPlaying = true;
  currentMusicType = "menu";
  scheduleMenuBar(ctx!.currentTime + 0.1);
}

export function playGameMusic() {
  ensureCtx();
  if (currentMusicType === "game") return;
  stopMusicNodes();
  musicPlaying = true;
  currentMusicType = "game";
  scheduleGameBar(ctx!.currentTime + 0.1);
}

export function stopMusic() {
  stopMusicNodes();
}

export function setMusicVolume(v: number) {
  if (musicGain) musicGain.gain.value = v;
}
export function setSfxVolume(v: number) {
  if (sfxGain) sfxGain.gain.value = v;
}
