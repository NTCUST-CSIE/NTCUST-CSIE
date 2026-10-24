// rickroll 的音效：用 Web Audio 現場合成一段八位元迴圈（120 BPM，四小節）。
// 不是原曲的錄音，只是一段原創的和弦與節奏，聽起來有那個味道就好。

let audio: AudioContext | null = null;

// 四個和弦：每個小節一組低音與琶音音高（Hz）
const PROGRESSION = [
  { bass: 110, arp: [220, 261.63, 329.63] },
  { bass: 87.31, arp: [174.61, 220, 261.63] },
  { bass: 130.81, arp: [261.63, 329.63, 392] },
  { bass: 98, arp: [196, 246.94, 293.66] },
];

const BEAT = 0.5;

export const playRickrollSound = (seconds = 8) => {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;

  audio ??= new Ctor();
  const ctx = audio;
  if (ctx.state === 'suspended') void ctx.resume();

  const tone = (freq: number, start: number, dur: number, type: OscillatorType, gain: number) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };

  // 底鼓：正弦波從 140Hz 掉到 40Hz
  const kick = (start: number) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.frequency.setValueAtTime(140, start);
    osc.frequency.exponentialRampToValueAtTime(40, start + 0.12);
    amp.gain.setValueAtTime(0.5, start);
    amp.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.16);
  };

  const t0 = ctx.currentTime + 0.05;
  const bars = Math.max(1, Math.floor(seconds / (BEAT * 4)));
  for (let bar = 0; bar < bars; bar++) {
    const chord = PROGRESSION[bar % PROGRESSION.length];
    for (let beat = 0; beat < 4; beat++) {
      const start = t0 + (bar * 4 + beat) * BEAT;
      if (beat % 2 === 0) kick(start);
      tone(chord.bass, start, BEAT * 0.9, 'triangle', 0.25);
      // 每拍兩個八分音符的琶音
      for (let eighth = 0; eighth < 2; eighth++) {
        const freq = chord.arp[(beat * 2 + eighth) % chord.arp.length];
        tone(freq, start + (eighth * BEAT) / 2, (BEAT / 2) * 0.9, 'square', 0.06);
      }
    }
  }
};
