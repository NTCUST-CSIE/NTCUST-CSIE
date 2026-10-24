import { useEffect, useState } from 'react';
import { discoverEgg } from '../utils/eggs';
import { playPetSound } from '../utils/petSound';

// 終端機角落的小寵物：原創角色，每格 7 欄 × 5 列。點一下會跳一小段舞。
const IDLE = [
  '       ',
  ' ▄▄▄▄▄ ',
  '█ ◉ ◉ █',
  '█  ▿  █',
  ' ▀▀▀▀▀ ',
];

const DANCE = [
  [
    '   ♪   ',
    '\\▄▄▄▄▄/',
    '█ ◉ ◉ █',
    '█  ▿  █',
    ' ▀▀▀▀▀ ',
  ],
  [
    '  ♪    ',
    '/▄▄▄▄▄\\',
    '█ ◉ ◉ █',
    '█  ▿  █',
    '▄▀   ▀▄',
  ],
  [
    '    ♪  ',
    '\\▄▄▄▄▄/',
    '█ ◉ ◉ █',
    '█  ▿  █',
    '▀▄   ▄▀',
  ],
];

const DANCE_MS = 2400;
const BEAT_MS = 160;

const TerminalPet = () => {
  // 每點一次 beat 就加一，effect 會重新跳一段舞
  const [beat, setBeat] = useState(0);
  const [frame, setFrame] = useState<string[]>(IDLE);

  useEffect(() => {
    if (beat === 0) return;
    let step = 0;
    const tick = setInterval(() => {
      setFrame(DANCE[step % DANCE.length]);
      step += 1;
    }, BEAT_MS);
    const stop = setTimeout(() => {
      clearInterval(tick);
      setFrame(IDLE);
    }, DANCE_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(stop);
    };
  }, [beat]);

  return (
    <button
      type="button"
      className="terminal-pet"
      aria-label="終端機寵物，點一下跳舞"
      onClick={() => {
        // 寵物是彩蛋：第一次點擊就發現，之後每次點擊都會再跳一段舞
        discoverEgg('pet');
        playPetSound();
        setBeat(b => b + 1);
      }}
    >
      <pre>{frame.join('\n')}</pre>
    </button>
  );
};

export default TerminalPet;
