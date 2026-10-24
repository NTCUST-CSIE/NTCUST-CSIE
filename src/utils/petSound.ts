import { getAudioContext } from './sound';

// 點寵物的小音效：兩聲短促的上滑音，原創合成，不使用任何現成的音檔
export const playPetSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const chirp = (start: number, from: number, to: number) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + 0.09);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.13);
  };

  const t0 = ctx.currentTime;
  chirp(t0, 520, 880);
  chirp(t0 + 0.12, 660, 1180);
};
