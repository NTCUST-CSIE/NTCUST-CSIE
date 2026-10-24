import { discoverEgg, eggs, getFoundEggs, openTerminal } from './eggs';

declare global {
  interface Window {
    csie?: Record<string, () => void>;
  }
}

const logo = String.raw`
  ____ ____ ___ _____
 / ___/ ___|_ _| ____|
| |   \___ \| ||  _|
| |___ ___) | || |___
 \____|____/___|_____|
`;

export const printConsoleBanner = () => {
  console.log(`%c${logo}`, 'color:#60a5fa;font-weight:700;font-family:monospace;font-size:12px');
  console.log('%c嗨，會打開 Console 的你，要不要考慮加入科會資訊部？', 'font-size:14px;font-weight:700');
  console.log(`%c🚩 CSIE CTF 1/5：${atob('Q1NJRXtoNGNrXw==')}`, 'color:#f97316;font-weight:700;font-size:13px');
  console.log('💡 下一片藏在這個網頁的原始碼裡（試試 Ctrl+U）。規則與提交：/flag');
  console.log('%c輸入 csie.help() 看看還能做什麼', 'color:#94a3b8');

  // 在 Console 呼叫任何一個 csie.xxx() 就算找到 Console 彩蛋
  const withEgg = (fn: () => void) => () => {
    discoverEgg('console');
    fn();
  };

  window.csie = {
    help: withEgg(() => {
      console.log('csie.hello()     打聲招呼\ncsie.terminal()  打開終端機\ncsie.eggs()      來看你找到了多少彩蛋 ouo');
    }),
    hello: withEgg(() => {
      console.log('Hello World!');
    }),
    terminal: withEgg(openTerminal),
    eggs: withEgg(() => {
      const found = getFoundEggs();
      console.table(eggs.map(e => ({
        彩蛋: found.includes(e.id) ? e.name : '???',
        狀態: found.includes(e.id) ? '✅' : '⬜',
        提示: e.hint,
      })));
    }),
  };
};
