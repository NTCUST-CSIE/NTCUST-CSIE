import seasonalData from '../data/seasonal.json';

export interface Season {
  id: string;
  name: string;
  start: string; // MM-DD（臺灣時間，含當天）
  end: string;   // MM-DD（臺灣時間，含當天）；比 start 早代表跨年
  emojis: string[];
  motion: 'rise' | 'fall' | 'none';
  greeting: string;
  surprise: string;
}

const seasons = seasonalData as Season[];

// 一律用臺灣時間判斷，避免海外訪客看到錯的節日
const getTaipeiMonthDay = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const month = parts.find(p => p.type === 'month')?.value ?? '01';
  const day = parts.find(p => p.type === 'day')?.value ?? '01';
  return `${month}-${day}`;
};

const isInWindow = (today: string, start: string, end: string) =>
  start <= end ? today >= start && today <= end : today >= start || today <= end;

let cachedSeason: Season | null | undefined;

// 期間限定：只有在 seasonal.json 設定的日期區間內才會回傳節日，過了就自動消失
// 預覽用：網址加上 ?season=halloween 可以強制開啟，?season=none 強制關閉
export const getActiveSeason = (): Season | null => {
  if (cachedSeason !== undefined) return cachedSeason;

  const preview = new URLSearchParams(window.location.search).get('season');
  if (preview) {
    cachedSeason = seasons.find(s => s.id === preview) ?? null;
    return cachedSeason;
  }

  const today = getTaipeiMonthDay();
  cachedSeason = seasons.find(s => isInWindow(today, s.start, s.end)) ?? null;
  return cachedSeason;
};

export const applySeasonAttribute = () => {
  const season = getActiveSeason();
  if (season) document.documentElement.setAttribute('data-season', season.id);
};
