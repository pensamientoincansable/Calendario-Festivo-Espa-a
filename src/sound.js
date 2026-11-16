const MUTE_KEY = 'festeja:muted';

let audioCtx = null;
let muted = false;

if (typeof window !== 'undefined') {
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    muted = false;
  }
}

function getContext() {
  if (muted || typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function tone(freq, duration = 0.12, { type = 'sine', gain = 0.11, slideTo = null, delay = 0 } = {}) {
  if (!(freq > 0)) return;
  const ctx = getContext();
  if (!ctx) return;
  try {
    const safeDuration = Math.max(0.02, duration);
    const start = ctx.currentTime + Math.max(0, delay);
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), start + safeDuration);
    }
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(gain, start + Math.min(0.012, safeDuration * 0.4));
    amp.gain.exponentialRampToValueAtTime(0.0001, start + safeDuration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + safeDuration + 0.02);
  } catch {
    // Ignorar errores de audio en navegadores restringidos
  }
}

function noiseBurst(duration = 0.14, { gain = 0.08, highpass = 700, delay = 0 } = {}) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const safeDuration = Math.max(0.02, duration);
    const start = ctx.currentTime + Math.max(0, delay);
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * safeDuration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(highpass, start);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(Math.max(0.0002, gain), start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + safeDuration);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    source.start(start);
    source.stop(start + safeDuration + 0.02);
  } catch {
    // Ignorar errores de audio
  }
}

export function isSoundMuted() {
  return muted;
}

export function setSoundMuted(next) {
  muted = Boolean(next);
  if (muted && audioCtx && audioCtx.state === 'running') {
    audioCtx.suspend().catch(() => {});
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      // Sin almacenamiento persistente
    }
  }
  return muted;
}

export const sfx = {
  tap() {
    tone(520, 0.06, { type: 'triangle', gain: 0.08, slideTo: 620 });
  },
  swap() {
    tone(420, 0.08, { type: 'sine', gain: 0.08, slideTo: 560 });
  },
  invalid() {
    tone(240, 0.11, { type: 'triangle', gain: 0.09, slideTo: 180 });
    tone(190, 0.12, { type: 'triangle', gain: 0.08, slideTo: 150, delay: 0.08 });
  },
  match(combo = 1) {
    const base = 440 * (1 + Math.min(combo - 1, 6) * 0.12);
    tone(base, 0.12, { type: 'triangle', gain: 0.11 });
    tone(base * 1.25, 0.15, { type: 'sine', gain: 0.1, delay: 0.05 });
    if (combo >= 2) {
      tone(base * 1.5, 0.18, { type: 'sine', gain: 0.09, delay: 0.1 });
    }
  },
  special() {
    tone(520, 0.22, { type: 'sawtooth', gain: 0.07, slideTo: 1040 });
    tone(780, 0.24, { type: 'triangle', gain: 0.1, delay: 0.05, slideTo: 1320 });
    noiseBurst(0.18, { gain: 0.06, highpass: 1200 });
  },
  collect(streak = 1) {
    const base = 587 + Math.min(streak, 8) * 38;
    tone(base, 0.09, { type: 'sine', gain: 0.1 });
    tone(base * 1.33, 0.13, { type: 'triangle', gain: 0.09, delay: 0.045 });
  },
  drop() {
    tone(660, 0.14, { type: 'sine', gain: 0.08, slideTo: 340 });
  },
  toss() {
    tone(360, 0.13, { type: 'sine', gain: 0.08, slideTo: 720 });
  },
  gift() {
    tone(523.25, 0.1, { type: 'triangle', gain: 0.11 });
    tone(659.25, 0.11, { type: 'triangle', gain: 0.11, delay: 0.05 });
    tone(783.99, 0.16, { type: 'sine', gain: 0.11, delay: 0.1 });
  },
  boost() {
    tone(220, 0.26, { type: 'sawtooth', gain: 0.07, slideTo: 660 });
    noiseBurst(0.22, { gain: 0.06, highpass: 900 });
  },
  hit() {
    tone(175, 0.18, { type: 'sawtooth', gain: 0.09, slideTo: 75 });
    noiseBurst(0.12, { gain: 0.07, highpass: 350 });
  },
  jump() {
    tone(310, 0.13, { type: 'sine', gain: 0.09, slideTo: 620 });
  },
  chime(perfect = true) {
    const root = perfect ? 880 : 740;
    tone(root, 0.34, { type: 'sine', gain: 0.13 });
    tone(root * 2, 0.22, { type: 'sine', gain: 0.05 });
    tone(root * 1.5, 0.26, { type: 'triangle', gain: 0.05, delay: 0.02 });
  },
  sizzle() {
    noiseBurst(0.16, { gain: 0.06, highpass: 1800 });
    tone(560, 0.09, { type: 'triangle', gain: 0.07, slideTo: 700 });
  },
  flip() {
    tone(340, 0.12, { type: 'sine', gain: 0.1, slideTo: 760 });
    tone(880, 0.16, { type: 'triangle', gain: 0.1, delay: 0.11 });
  },
  stack(perfect = false) {
    if (perfect) {
      tone(659.25, 0.12, { type: 'triangle', gain: 0.12 });
      tone(987.77, 0.2, { type: 'sine', gain: 0.11, delay: 0.05 });
    } else {
      tone(392, 0.09, { type: 'triangle', gain: 0.09, slideTo: 440 });
    }
  },
  firework() {
    noiseBurst(0.26, { gain: 0.09, highpass: 850 });
    tone(720, 0.18, { type: 'sine', gain: 0.09, slideTo: 1180 });
    tone(960, 0.2, { type: 'triangle', gain: 0.07, delay: 0.05, slideTo: 540 });
  },
  rotate() {
    tone(480, 0.055, { type: 'sine', gain: 0.07, slideTo: 580 });
  },
  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, index) => {
      tone(n, 0.22, { type: 'triangle', gain: 0.11, delay: index * 0.08 });
    });
  },
  end() {
    tone(440, 0.16, { type: 'triangle', gain: 0.09 });
    tone(349.23, 0.22, { type: 'sine', gain: 0.08, delay: 0.1 });
  },
};
