import eggsData from '../data/eggs.json';
import { reportEgg } from './analytics';

export interface Egg {
  id: string;
  name: string;
  hint: string;
  // 隱藏彩蛋：不計入總數，另外記錄（例如只在節日出現的）
  hidden?: boolean;
}

export const eggs = eggsData as Egg[];
export const mainEggs = eggs.filter(e => !e.hidden);
export const hiddenEggs = eggs.filter(e => e.hidden);

// 彩蛋之間用 window 事件溝通，元件不用互相傳 props
export const TOAST_EVENT = 'csie:toast';
export const TERMINAL_EVENT = 'csie:terminal';
export const THEME_EVENT = 'csie:theme';
export const CRASH_EVENT = 'csie:crash';

const FOUND_KEY = 'csie_eggs';
const CRASH_KEY = 'csie_crashed';

export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export const showToast = (message: string) => {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }));
};

export const openTerminal = () => {
  window.dispatchEvent(new Event(TERMINAL_EVENT));
};

export const requestTheme = (theme: 'dark' | 'light') => {
  window.dispatchEvent(new CustomEvent<string>(THEME_EVENT, { detail: theme }));
};

// localStorage 不能用時（無痕模式等）至少在這次瀏覽中記得
const memoryFound = new Set<string>();

export const getFoundEggs = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(FOUND_KEY) || '[]');
    if (Array.isArray(parsed)) parsed.forEach(id => memoryFound.add(String(id)));
  } catch {
    // ignore
  }
  return [...memoryFound];
};

const saveFoundEggs = (ids: string[]) => {
  ids.forEach(id => memoryFound.add(id));
  try {
    localStorage.setItem(FOUND_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
};

// 只清掉這台瀏覽器的紀錄；伺服器上的發現名次不動，之後重新找到還是原本的名次
const resetFoundEggs = (keep: string[]) => {
  memoryFound.clear();
  saveFoundEggs(keep);
};

// 第一次發現才記錄並跳通知；回傳伺服器給的名次（本機開發或離線時為 null）
export const discoverEgg = async (id: string, flag?: string) => {
  const egg = eggs.find(e => e.id === id);
  const found = getFoundEggs();
  if (!egg || found.includes(id)) return null;

  const nowFound = [...found, id];
  saveFoundEggs(nowFound);
  const report = await reportEgg(id, flag);
  const rankText = report ? `・你是第 ${report.rank} 位發現者` : '';
  if (egg.hidden) {
    showToast(`🌟 發現隱藏彩蛋「${egg.name}」${rankText}`);
  } else {
    const count = mainEggs.filter(e => nowFound.includes(e.id)).length;
    showToast(`🥚 發現彩蛋「${egg.name}」${rankText}（${count}/${mainEggs.length}）`);
  }
  return report;
};

let discoTimer: ReturnType<typeof setTimeout> | undefined;

export const startDisco = () => {
  showToast('🪩 你的眼睛還好嗎？反正資訊部的人已經瞎了');
  discoverEgg('disco');
  if (prefersReducedMotion()) return;

  const root = document.documentElement;
  root.classList.add('disco');
  clearTimeout(discoTimer);
  discoTimer = setTimeout(() => root.classList.remove('disco'), 6000);
};

let crashed = false;

export const isCrashed = () => crashed;

// sudo rm -rf / 刪完之後：網站假當機，彩蛋紀錄也真的被刪光，只留「刪庫跑路」
// 當機狀態只記在這個分頁，重新整理後才揭曉是開玩笑的
export const crashSite = () => {
  crashed = true;
  clearTimeout(discoTimer);
  document.documentElement.classList.remove('disco');
  resetFoundEggs(['rmrf']);
  try {
    sessionStorage.setItem(CRASH_KEY, '1');
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(CRASH_EVENT));
};

let recovered = false;
try {
  recovered = sessionStorage.getItem(CRASH_KEY) === '1';
  sessionStorage.removeItem(CRASH_KEY);
} catch {
  // ignore
}

export const recoveredFromCrash = recovered;
