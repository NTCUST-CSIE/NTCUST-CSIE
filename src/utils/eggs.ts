import eggsData from '../data/eggs.json';
import { reportEgg } from './analytics';

export interface Egg {
  id: string;
  name: string;
  hint: string;
}

export const eggs = eggsData as Egg[];

// 彩蛋之間用 window 事件溝通，元件不用互相傳 props
export const TOAST_EVENT = 'csie:toast';
export const MATRIX_EVENT = 'csie:matrix';
export const TERMINAL_EVENT = 'csie:terminal';
export const THEME_EVENT = 'csie:theme';

const FOUND_KEY = 'csie_eggs';
const MATRIX_KEY = 'csie_matrix';

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

// 第一次發現才記錄並跳通知；回傳伺服器給的名次（本機開發或離線時為 null）
export const discoverEgg = async (id: string, flag?: string) => {
  const egg = eggs.find(e => e.id === id);
  const found = getFoundEggs();
  if (!egg || found.includes(id)) return null;

  saveFoundEggs([...found, id]);
  const report = await reportEgg(id, flag);
  const rankText = report ? `・你是第 ${report.rank} 位發現者` : '';
  showToast(`🥚 發現彩蛋「${egg.name}」${rankText}（${found.length + 1}/${eggs.length}）`);
  return report;
};

let matrixOn = false;
try {
  matrixOn = sessionStorage.getItem(MATRIX_KEY) === '1';
} catch {
  // ignore
}

export const isMatrixOn = () => matrixOn;

export const toggleMatrix = () => {
  matrixOn = !matrixOn;
  try {
    if (matrixOn) sessionStorage.setItem(MATRIX_KEY, '1');
    else sessionStorage.removeItem(MATRIX_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent<boolean>(MATRIX_EVENT, { detail: matrixOn }));
  showToast(matrixOn ? '🐇 Wake up, Neo… 歡迎進入 Matrix' : '💊 你吞下了藍色藥丸，回到現實世界');
  return matrixOn;
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
