// Tiny Web Audio synth: sfx + looping cheerful melody.
let ctx: AudioContext | null = null;
let musicTimer: number | null = null;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15, slide = 0, delay = 0) {
  const a = ac();
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur);
}

export function playSfx(name: string) {
  switch (name) {
    case "jump": tone(420, 0.18, "triangle", 0.15, 1.8); break;
    case "land": tone(140, 0.08, "sine", 0.12, 0.7); break;
    case "fish": tone(880, 0.08, "square", 0.06); tone(1320, 0.12, "square", 0.06, 1, 0.06); break;
    case "star": [660, 880, 1100, 1320].forEach((f, i) => tone(f, 0.15, "triangle", 0.1, 1, i * 0.07)); break;
    case "hit": tone(300, 0.3, "sawtooth", 0.1, 0.4); break;
    case "meow": tone(700, 0.12, "sine", 0.15, 1.3); tone(900, 0.3, "sine", 0.15, 0.6, 0.1); break;
    case "over": [523, 440, 349, 262].forEach((f, i) => tone(f, 0.3, "triangle", 0.12, 1, i * 0.2)); break;
  }
}

const MELODY = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587];

export function startMusic() {
  if (musicTimer !== null) return;
  let i = 0;
  musicTimer = window.setInterval(() => {
    tone(MELODY[i % MELODY.length]!, 0.22, "triangle", 0.04);
    if (i % 4 === 0) tone(MELODY[i % MELODY.length]! / 4, 0.4, "sine", 0.05);
    i++;
  }, 240);
}

export function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
}
