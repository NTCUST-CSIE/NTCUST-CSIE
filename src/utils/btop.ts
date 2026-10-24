// 模擬 aristocratos/btop 的畫面，版面以截圖的 190 × 50 格對位。
// 數字是假的，但會跟著圖表一起跳動；主機名稱、IP、使用者都換成虛構的值。
// 行程表可以用 ↑↓ 選取，按 Enter / k / s 送出訊號。被殺掉的行程會被系統重新拉起來，所以殺不完。

export const COLS = 190;
export const ROWS = 50;

const COLOR = {
  text: '#e6edf3',
  label: '#8b949e',
  empty: '#2b3038',
  green: '#7fd17f',
  yellow: '#e5c44a',
  red: '#e35d5d',
  blue: '#5b8fe0',
  orange: '#e0873a',
  cyan: '#56c8d8',
  select: '#2d4a6e',
  panel: '#161b22',
  border: {
    cpu: '#a7b0b8',
    mem: '#d8c24a',
    net: '#4a6fd6',
    proc: '#d64646',
  },
};

const BLOCKS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export interface BtopRun {
  text: string;
  color?: string;
  bg?: string;
}
export type BtopRow = BtopRun[];

interface Cell {
  ch: string;
  color?: string;
  bg?: string;
}

// 一格一格的畫布，最後轉成帶顏色的列
class Canvas {
  private grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, (): Cell => ({ ch: ' ' })),
  );

  set(x: number, y: number, ch: string, color?: string, bg?: string) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    this.grid[y][x] = { ch, color, bg };
  }

  put(x: number, y: number, text: string, color?: string) {
    [...text].forEach((ch, i) => this.set(x + i, y, ch, color));
  }

  // 文字靠右對齊，最後一個字落在 endX
  right(endX: number, y: number, text: string, color?: string) {
    this.put(endX - [...text].length + 1, y, text, color);
  }

  fill(x: number, y: number, w: number, h: number, bg: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, ' ', undefined, bg);
  }

  // 只改背景色，保留原本的字
  highlight(x0: number, x1: number, y: number, bg: string) {
    if (y < 0 || y >= ROWS) return;
    for (let x = x0; x <= x1 && x < COLS; x++) this.grid[y][x] = { ...this.grid[y][x], bg };
  }

  box(x: number, y: number, w: number, h: number, color: string) {
    const x2 = x + w - 1;
    const y2 = y + h - 1;
    for (let i = x + 1; i < x2; i++) {
      this.set(i, y, '─', color);
      this.set(i, y2, '─', color);
    }
    for (let j = y + 1; j < y2; j++) {
      this.set(x, j, '│', color);
      this.set(x2, j, '│', color);
    }
    this.set(x, y, '┌', color);
    this.set(x2, y, '┐', color);
    this.set(x, y2, '└', color);
    this.set(x2, y2, '┘', color);
  }

  // 一列方塊條；填滿的部分用 fill 色，空的用 empty 色
  bar(x: number, y: number, w: number, pct: number, fill: string) {
    const n = Math.round((clamp(pct, 0, 100) / 100) * w);
    for (let i = 0; i < w; i++) this.set(x + i, y, '■', i < n ? fill : COLOR.empty);
  }

  // 歷史曲線：最右邊是最新的值，高度 h 列，每格 8 階
  graph(x: number, y: number, w: number, h: number, values: number[], fixed?: string) {
    const vals = values.slice(-w);
    const offset = w - vals.length;
    vals.forEach((v, i) => {
      const level = Math.round((clamp(v, 0, 100) / 100) * h * 8);
      for (let r = 0; r < h; r++) {
        const cell = clamp(level - r * 8, 0, 8);
        if (cell === 0) continue;
        const frac = (r + 1) / h;
        const color = fixed ?? (frac < 0.6 ? COLOR.green : frac < 0.85 ? COLOR.yellow : COLOR.red);
        this.set(x + offset + i, y + h - 1 - r, BLOCKS[cell], color);
      }
    });
  }

  rows(): BtopRow[] {
    return this.grid.map(row => {
      const runs: BtopRun[] = [];
      for (const cell of row) {
        const last = runs[runs.length - 1];
        if (last && last.color === cell.color && last.bg === cell.bg) last.text += cell.ch;
        else runs.push({ text: cell.ch, color: cell.color, bg: cell.bg });
      }
      return runs;
    });
  }
}

interface Proc {
  pid: number;
  program: string;
  command: string;
  threads: number;
  user: string;
  memB: string;
  // 基準 CPU%，0 代表閒置；實際值每次更新會在基準附近大幅跳動
  base: number;
}

interface LiveProc extends Proc {
  cpu: number;
}

// 行程表照截圖排列
const PROCS: Proc[] = [
  { pid: 3426753, program: 'MainThread', command: 'node --require /usr/loc', threads: 12, user: 'guest', memB: '486G', base: 0.4 },
  { pid: 2012235, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 56, user: 'guest', memB: '2.3G', base: 0.8 },
  // 瀏覽器分頁：標題是 rick roll，kill 掉會觸發彩蛋
  { pid: 7731, program: 'youtube', command: 'rick roll', threads: 8, user: 'guest', memB: '412M', base: 1.8 },
  { pid: 3420079, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 129, user: 'guest', memB: '1.6G', base: 9.9 },
  { pid: 3422005, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 92, user: 'guest', memB: '1.5G', base: 0 },
  { pid: 3276018, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 66, user: 'guest', memB: '1.5G', base: 0 },
  { pid: 2151981, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 45, user: 'guest', memB: '1.3G', base: 0 },
  { pid: 3422196, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 39, user: 'guest', memB: '1.3G', base: 0 },
  { pid: 3427061, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 90, user: 'guest', memB: '1.2G', base: 0 },
  { pid: 3425877, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 47, user: 'guest', memB: '791M', base: 0 },
  { pid: 3416374, program: 'python3', command: '/usr/local/bin/python3', threads: 67, user: 'root', memB: '732M', base: 0 },
  { pid: 3420084, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 38, user: 'guest', memB: '623M', base: 0 },
  { pid: 3375361, program: 'systemd-journal', command: '/lib/systemd/systemd-jo', threads: 1, user: 'root', memB: '260M', base: 0 },
  { pid: 3427351, program: 'MainThread', command: 'node --require /usr/loc', threads: 12, user: 'guest', memB: '209M', base: 0.3 },
  { pid: 3427508, program: 'MainThread', command: 'node --require /usr/loc', threads: 12, user: 'guest', memB: '208M', base: 0.2 },
  { pid: 3427760, program: 'MainThread', command: 'node --require /usr/loc', threads: 32, user: 'guest', memB: '192M', base: 0 },
  { pid: 1165343, program: 'MainThread', command: 'node --require /usr/loc', threads: 12, user: 'guest', memB: '183M', base: 0 },
  { pid: 881274, program: 'fwupd', command: '/usr/libexec/fwupd/fwup', threads: 5, user: 'root', memB: '157M', base: 0 },
  { pid: 3415964, program: 'dockerd', command: '/usr/bin/dockerd -H fd:', threads: 97, user: 'root', memB: '128M', base: 0.6 },
  { pid: 1036, program: 'zerotier-one', command: '/usr/sbin/zerotier-one', threads: 49, user: 'zerotier', memB: '102M', base: 0 },
  { pid: 991, program: 'node', command: '/opt/node-v20.12.2-linu', threads: 11, user: 'root', memB: '82M', base: 0 },
  { pid: 547397, program: 'python', command: '/usr/local/bin/python /', threads: 4, user: 'guest', memB: '80M', base: 0 },
  { pid: 3388622, program: 'containerd', command: '/usr/bin/containerd', threads: 27, user: 'root', memB: '55M', base: 0 },
  { pid: 990, program: 'node', command: '/opt/node-v20.12.2-linu', threads: 11, user: 'root', memB: '54M', base: 0 },
  { pid: 3417009, program: 'wings', command: '/usr/local/bin/wings', threads: 27, user: 'root', memB: '53M', base: 0 },
  { pid: 812, program: 'sshd', command: 'sshd: /usr/sbin/sshd -D', threads: 1, user: 'root', memB: '42M', base: 0 },
  { pid: 903, program: 'rsyslogd', command: '/usr/sbin/rsyslogd -n', threads: 4, user: 'root', memB: '38M', base: 0 },
  { pid: 1190, program: 'mysqld', command: '/usr/sbin/mysqld', threads: 36, user: 'mysql', memB: '31M', base: 1.2 },
  { pid: 1044, program: 'nginx', command: 'nginx: master process', threads: 1, user: 'root', memB: '18M', base: 0 },
  { pid: 1402, program: 'php-fpm', command: 'php-fpm: pool www', threads: 1, user: 'www-data', memB: '14M', base: 0 },
  { pid: 3520, program: 'cron', command: '/usr/sbin/cron -f', threads: 1, user: 'root', memB: '6M', base: 0 },
];

// 這個模擬本身的行程；kill 到它就等於 q 離開
const BTOP_PID = 4096;

const SIGNALS: { name: string; kills: boolean }[] = [
  { name: 'SIGTERM', kills: true },
  { name: 'SIGKILL', kills: true },
  { name: 'SIGHUP', kills: true },
  { name: 'SIGINT', kills: true },
  { name: 'SIGQUIT', kills: true },
  { name: 'SIGSTOP', kills: false },
  { name: 'SIGCONT', kills: false },
  { name: 'SIGUSR1', kills: false },
  { name: 'SIGUSR2', kills: false },
  { name: 'SIGALRM', kills: false },
];

// 三顆 AMD Ryzen Threadripper PRO 9995WX，每顆 96 核，共 288 核
const SOCKETS = 3;
const CORES_PER_SOCKET = 96;
const CORE_COUNT = SOCKETS * CORES_PER_SOCKET;
const CPU_HIST = 66;
const CORE_HIST = 9;
const NET_HIST = 44;
const PROC_ROWS = 30;
const RICKROLL_MS = 8000;
const ROOT_DISK_TB = 245.76;
const RAM_GIB = 2048;

// rickroll 播放器裡的 ASCII 小人，三格循環；每格 11 行
const RICK_FRAMES: string[][] = [
  [
    '    .-"""""-.   ',
    '   /  O   O  \\  ',
    '  |     ^     | ',
    '  |   \\___/   | ',
    '   \\_________/ ',
    ' .--\'  | |  \'--.',
    '/      | |      \\',
    '/_______| |_______\\',
    '        | |       ',
    '       /   \\      ',
    '      /     \\     ',
  ],
  [
    '\\o/ .-"""""-. \\o/',
    '     /  O   O  \\ ',
    '    |     ^     |',
    '    |   \\___/   |',
    '     \\_________/ ',
    '      .--\'  \'--.  ',
    '     /   | |    \\ ',
    '    /____| |____\\',
    '         | |      ',
    '        /   \\     ',
    '       /     \\    ',
  ],
  [
    '    .-"""""-.   ',
    '   /  O   O  \\  ',
    '  |     ^     | ',
    '  |   /___\\   | ',
    '   \\_________/ ',
    ' .--\'  | |  \'--.',
    '/      | |      \\',
    '/_______| |_______\\',
    '        | |       ',
    '       _/   \\_    ',
    '      /       \\   ',
  ],
];

const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

// 行程被殺掉後重新拉起來的紀錄
interface Respawn {
  proc: LiveProc;
  index: number;
  at: number;
}

type Modal =
  | { kind: 'confirm'; pid: number; signal: string }
  | { kind: 'signals'; index: number };

export interface BtopState {
  cpu: number[];
  cores: number[];
  coreHist: number[][];
  down: number[];
  up: number[];
  // 網路速率 = 曲線值 × 6 GiB/s；累計流量與峰值單位是 GiB
  downTotal: number;
  upTotal: number;
  downTop: number;
  upTop: number;
  // mem 面板 Used / Available / Cached / Free 各自的百分比曲線
  memHist: number[][];
  // 根目錄磁碟的使用率（%）
  diskUsed: number;
  // load average 1 / 5 / 15 分鐘
  load: number[];
  respawns: Respawn[];
  procs: LiveProc[];
  selected: number;
  modal: Modal | null;
  notice: { text: string; color: string; until: number } | null;
  // kill 到 rick roll 時的播放器畫面
  rickroll: { start: number; until: number } | null;
}

const filled = (n: number, v: number) => Array<number>(n).fill(v);

export const createBtop = (): BtopState => {
  const cores = Array.from({ length: CORE_COUNT }, () => 20 + Math.random() * 30);
  return {
    cpu: filled(CPU_HIST, 30),
    cores,
    coreHist: cores.map(v => filled(CORE_HIST, v)),
    down: filled(NET_HIST, 50),
    up: filled(NET_HIST, 28),
    downTotal: 39526,
    upTotal: 22426,
    downTop: 512,
    upTop: 344,
    memHist: [30, 70, 26, 42].map(v => filled(32, v)),
    diskUsed: 18,
    load: [86.1, 84.7, 80.2],
    respawns: [],
    procs: PROCS.map(p => ({ ...p, cpu: p.base })),
    selected: 0,
    modal: null,
    notice: null,
    rickroll: null,
  };
};

const push = (arr: number[], v: number) => {
  arr.shift();
  arr.push(v);
};

// 每 100ms 呼叫一次：數值往目標附近飄，幅度夠大，看得出來在跑
export const stepBtop = (s: BtopState) => {
  const now = Date.now();
  const drift = (prev: number, target: number, spread: number) =>
    clamp(prev + (target - prev) * 0.3 + (Math.random() - 0.5) * spread, 0, 100);

  if (s.rickroll && now >= s.rickroll.until) s.rickroll = null;

  // 被殺掉的行程會被系統重新拉起，回到原本的位置
  s.respawns = s.respawns.filter(r => {
    if (now < r.at) return true;
    s.procs.splice(Math.min(r.index, s.procs.length), 0, r.proc);
    return false;
  });

  // 288 核各自跳動，整體 CPU% 就是所有核心的平均
  s.cores = s.cores.map(c => drift(c, 30, 70));
  s.cores.forEach((c, i) => push(s.coreHist[i], c));
  const avg = s.cores.reduce((a, b) => a + b, 0) / CORE_COUNT;
  push(s.cpu, avg);
  const threads = (avg / 100) * CORE_COUNT;
  s.load = [
    s.load[0] + (threads - s.load[0]) * 0.05,
    s.load[1] + (threads - s.load[1]) * 0.01,
    s.load[2] + (threads - s.load[2]) * 0.003,
  ];

  // 100ms 內流過的量：速率 × 0.1 秒，累加到總量
  push(s.down, drift(s.down[s.down.length - 1], 50, 60));
  push(s.up, drift(s.up[s.up.length - 1], 28, 50));
  const downRate = s.down[s.down.length - 1] * 6;
  const upRate = s.up[s.up.length - 1] * 6;
  s.downTotal += downRate * 0.1;
  s.upTotal += upRate * 0.1;
  s.downTop = Math.max(s.downTop, downRate);
  s.upTop = Math.max(s.upTop, upRate);

  [30, 70, 26, 42].forEach((target, i) => push(s.memHist[i], drift(s.memHist[i][s.memHist[i].length - 1], target, 24)));
  s.diskUsed = clamp(s.diskUsed + (18 - s.diskUsed) * 0.05 + (Math.random() - 0.5) * 0.4, 17, 19);

  s.procs.forEach(p => {
    p.cpu = p.base > 0
      ? clamp(p.base * (0.2 + Math.random() * 1.8), 0, 100)
      : Math.random() < 0.15 ? Math.random() * 2 : 0;
  });
};

const killProc = (s: BtopState, pid: number, signal: string): 'quit' | 'meme' | void => {
  const index = s.procs.findIndex(p => p.pid === pid);
  if (index < 0) return;
  const proc = s.procs[index];
  const until = Date.now() + 3000;

  if (pid === BTOP_PID) return 'quit';

  const sig = SIGNALS.find(x => x.name === signal);
  if (!sig?.kills) {
    s.notice = { text: `sent ${signal} to ${pid} (${proc.program})`, color: COLOR.label, until };
    return;
  }
  s.procs.splice(index, 1);
  s.selected = clamp(s.selected, 0, Math.max(0, s.procs.length - 1));

  // 被殺掉的行程會被重新拉起，所以清單永遠殺不完
  const newPid = 1000 + Math.floor(Math.random() * 900000);
  s.respawns.push({ proc: { ...proc, pid: newPid, cpu: 0 }, index, at: Date.now() + 2500 + Math.random() * 1500 });
  s.notice = { text: `${signal} → ${pid} (${proc.program}) · restarted as ${newPid}`, color: COLOR.green, until };

  if (proc.command === 'rick roll') {
    s.rickroll = { start: Date.now(), until: Date.now() + RICKROLL_MS };
    return 'meme';
  }
};

// 回傳 'quit' 代表要離開 btop；'meme' 代表觸發了彩蛋
export const handleBtopKey = (s: BtopState, key: string): 'quit' | 'meme' | void => {
  if (key === 'CtrlC') return 'quit';
  // rickroll 播放中，按鍵先不理
  if (s.rickroll) return;

  if (s.modal?.kind === 'confirm') {
    const { pid, signal } = s.modal;
    if (key === 'y' || key === 'Y') {
      s.modal = null;
      return killProc(s, pid, signal);
    }
    if (key === 'n' || key === 'N' || key === 'Escape') s.modal = null;
    return;
  }

  if (s.modal?.kind === 'signals') {
    const menu = s.modal;
    if (key === 'ArrowUp') menu.index = Math.max(0, menu.index - 1);
    else if (key === 'ArrowDown') menu.index = Math.min(SIGNALS.length - 1, menu.index + 1);
    else if (key === 'Enter') {
      const proc = s.procs[s.selected];
      const signal = SIGNALS[menu.index].name;
      s.modal = null;
      if (proc) return killProc(s, proc.pid, signal);
    } else if (key === 'Escape' || key === 's') s.modal = null;
    return;
  }

  const proc = s.procs[s.selected];
  switch (key) {
    case 'ArrowUp':
      s.selected = Math.max(0, s.selected - 1);
      return;
    case 'ArrowDown':
      s.selected = Math.min(Math.max(0, s.procs.length - 1), s.selected + 1);
      return;
    case 'Enter':
    case 't':
      if (proc) s.modal = { kind: 'confirm', pid: proc.pid, signal: 'SIGTERM' };
      return;
    case 'k':
      if (proc) s.modal = { kind: 'confirm', pid: proc.pid, signal: 'SIGKILL' };
      return;
    case 's':
      s.modal = { kind: 'signals', index: 0 };
      return;
    case 'q':
    case 'Q':
    case 'Escape':
      return 'quit';
  }
};

// rickroll 播放器：仿 YouTube 的版面，影片的前 8 秒。畫面 ASCII 小人每 250ms 換一格
const renderRickroll = (s: BtopState, now: Date): BtopRow[] => {
  const c = new Canvas();
  const elapsed = (now.getTime() - s.rickroll!.start) / 1000;
  const shown = Math.min(elapsed, RICKROLL_MS / 1000);
  c.fill(0, 0, COLS, ROWS, '#0f0f0f');

  // 頂欄
  c.fill(0, 0, COLS, 3, '#212121');
  c.put(4, 1, '▶', '#ff0000');
  c.put(6, 1, 'YouTube', COLOR.text);
  c.right(186, 1, 'Sign in', COLOR.text);

  // 影片畫面
  const px = 30;
  const pw = 130;
  const py = 4;
  const ph = 30;
  c.fill(px, py, pw, ph, '#000000');
  const frame = RICK_FRAMES[Math.floor(elapsed * 4) % RICK_FRAMES.length];
  const fx = px + Math.floor((pw - 20) / 2);
  const fy = py + Math.floor((ph - frame.length) / 2);
  frame.forEach((line, i) => c.put(fx, fy + i, line, COLOR.text));

  // 進度條與控制列
  const total = 213;
  const timecode = `${fmtTime(shown)} / ${fmtTime(total)}`;
  c.fill(px, py + ph, pw, 1, '#3a3a3a');
  c.fill(px, py + ph, Math.max(1, Math.round((pw * shown) / total)), 1, '#ff0000');
  c.put(px, py + ph + 1, `▶  ⏭  ♪ ━━━━━     ${timecode}`, COLOR.text);
  c.right(px + pw - 1, py + ph + 1, 'CC  ⚙  ⛶', COLOR.text);

  // 影片資訊
  c.put(px, py + ph + 3, 'Rick Astley - Never Gonna Give You Up (Official Music Video)', COLOR.text);
  c.put(px, py + ph + 4, 'Rick Astley', COLOR.label);

  // 殺掉的紀錄
  c.put(px, py + ph + 7, 'youtube (pid 7731) · chrome · guest', COLOR.label);
  c.put(px, py + ph + 8, 'you just got rickrolled', COLOR.yellow);

  return c.rows();
};

const heat = (pct: number) => (pct < 25 ? COLOR.green : pct < 60 ? COLOR.yellow : COLOR.red);

const memSize = (pct: number) => {
  const gib = (RAM_GIB * pct) / 100;
  return gib >= 1024 ? `${(gib / 1024).toFixed(2)} TiB` : `${Math.round(gib)} GiB`;
};

const fmt = (n: number) => n.toFixed(1).padStart(5);

export const renderBtop = (s: BtopState, now: Date): BtopRow[] => {
  if (s.rickroll && now.getTime() < s.rickroll.until) return renderRickroll(s, now);

  const c = new Canvas();
  const time = now.toTimeString().slice(0, 8);
  const cpuNow = Math.round(s.cpu[s.cpu.length - 1]);

  // ── cpu ──────────────────────────────────────────────
  c.box(0, 0, COLS, 16, COLOR.border.cpu);
  c.put(1, 0, '¹', COLOR.red);
  c.put(2, 0, 'cpu', COLOR.text);
  c.put(16, 0, 'menu', COLOR.text);
  c.put(29, 0, 'preset', COLOR.text);
  c.put(37, 0, '*', COLOR.red);
  c.put(90, 0, time, COLOR.text);
  c.put(174, 0, '-', COLOR.red);
  c.put(176, 0, '100ms', COLOR.text);
  c.put(183, 0, '+', COLOR.green);

  // 左邊：整體 CPU 使用率與曲線，下面是 load 和 uptime
  c.put(3, 2, 'CPU', COLOR.label);
  c.bar(8, 2, 40, cpuNow, COLOR.green);
  c.right(52, 2, `${cpuNow}%`, COLOR.text);
  c.put(55, 2, `${Math.round(38 + cpuNow * 0.5)}°C`, COLOR.blue);
  c.graph(3, 3, 66, 10, s.cpu);
  c.put(3, 13, 'Load AVG:', COLOR.label);
  s.load.forEach((v, i) => c.put(13 + i * 7, 13, v.toFixed(2), COLOR.text));
  // 跟 uptime、neofetch 一樣，算的是你待在網站上的時間
  const mins = Math.floor(performance.now() / 60000);
  c.put(3, 14, `up 0d ${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`, COLOR.label);

  // 右側：三顆 CPU 各 96 核，每核一格，顏色代表使用率
  c.box(72, 1, 117, 14, COLOR.border.cpu);
  c.put(75, 1, '3 × AMD Ryzen Threadripper PRO 9995WX', COLOR.text);
  c.right(186, 1, '5.4 GHz', COLOR.text);

  for (let socket = 0; socket < SOCKETS; socket++) {
    const x0 = 74 + socket * 24;
    const base = socket * CORES_PER_SOCKET;
    for (let k = 0; k < CORES_PER_SOCKET; k++) {
      const row = Math.floor(k / 8);
      const col = k % 8;
      c.put(x0 + col * 2, 2 + row, '■', heat(s.cores[base + k]));
    }
    const sum = s.cores.slice(base, base + CORES_PER_SOCKET).reduce((a, b) => a + b, 0);
    const socketAvg = Math.round(sum / CORES_PER_SOCKET);
    const temp = Math.round(38 + socketAvg * 0.5);
    const watt = Math.round(160 + socketAvg * 2.4);
    const infoX = 146;
    const infoY = 2 + socket * 4;
    c.put(infoX, infoY, `socket ${socket}  avg ${socketAvg}%`, COLOR.text);
    c.put(infoX, infoY + 1, `${CORES_PER_SOCKET} cores  ${temp}°C  ${watt} W`, COLOR.label);
  }
  c.put(146, 13, '■', COLOR.green);
  c.put(148, 13, '<25%', COLOR.label);
  c.put(154, 13, '■', COLOR.yellow);
  c.put(156, 13, '<60%', COLOR.label);
  c.put(162, 13, '■', COLOR.red);
  c.put(164, 13, '60%+', COLOR.label);

  // ── mem ──────────────────────────────────────────────
  c.box(1, 16, 42, 20, COLOR.border.mem);
  c.put(2, 16, '²', COLOR.red);
  c.put(3, 16, 'mem', COLOR.text);
  c.put(8, 16, 'DDR5-5600', COLOR.label);
  c.put(2, 18, 'Total:', COLOR.text);
  c.right(40, 18, '2.00 TiB', COLOR.text);
  const memItems: [string, number, string, number][] = [
    ['Used:', 0, COLOR.red, 19],
    ['Available:', 1, COLOR.orange, 23],
    ['Cached:', 2, COLOR.cyan, 27],
    ['Free:', 3, COLOR.green, 31],
  ];
  memItems.forEach(([label, i, color, y]) => {
    const v = s.memHist[i][s.memHist[i].length - 1];
    c.put(2, y, label, COLOR.text);
    c.right(40, y, memSize(v), COLOR.text);
    c.put(3, y + 1, `${Math.round(v)}%`, COLOR.text);
    c.graph(8, y + 1, 32, 3, s.memHist[i], color);
  });

  // ── disks ────────────────────────────────────────────
  c.box(42, 16, 44, 20, COLOR.border.mem);
  c.put(43, 16, '³', COLOR.red);
  c.put(44, 16, 'disks', COLOR.text);
  c.put(79, 16, 'io', COLOR.text);
  const used = s.diskUsed;
  const disks: [number, string, string, [string, number, string][]][] = [
    [18, 'Micron 6600 ION', `${ROOT_DISK_TB} TB`, [
      ['IO%', 0, ''],
      ['Used:', used, `${((ROOT_DISK_TB * used) / 100).toFixed(1)} TB`],
      ['Free:', 100 - used, `${((ROOT_DISK_TB * (100 - used)) / 100).toFixed(1)} TB`],
    ]],
    [23, 'swap', '64 GiB', [['Used:', 1, '0.6 GiB'], ['Free:', 99, '63.4 GiB']]],
    [27, 'boot', '1.90 GiB', [['IO%', 0, ''], ['Used:', 19, '378 MiB'], ['Free:', 81, '1.53 GiB']]],
    [32, 'efi', '1.04 GiB', [['IO%', 0, ''], ['Used:', 1, '6.08 MiB']]],
  ];
  disks.forEach(([y, name, size, rows]) => {
    c.put(44, y, name, COLOR.text);
    c.right(84, y, size, COLOR.text);
    rows.forEach(([label, pct, val], i) => {
      const row = y + 1 + i;
      if (label === 'IO%') {
        c.put(44, row, 'IO%', COLOR.label);
        return;
      }
      const fill = label === 'Used:' ? COLOR.red : COLOR.green;
      c.put(44, row, label, COLOR.text);
      c.put(51, row, `${Math.round(pct)}%`, COLOR.text);
      c.bar(55, row, 16, pct, fill);
      c.right(84, row, val, COLOR.text);
    });
  });

  // ── net ──────────────────────────────────────────────
  c.box(0, 36, 86, 13, COLOR.border.net);
  c.put(1, 36, '¹', COLOR.red);
  c.put(2, 36, 'net', COLOR.text);
  c.put(8, 36, '10.0.0.42', COLOR.text);
  c.put(47, 36, 'sync', COLOR.label);
  c.put(54, 36, 'auto', COLOR.label);
  c.put(60, 36, 'zero', COLOR.label);
  c.put(66, 36, '<', COLOR.red);
  c.put(67, 36, 'b', COLOR.red);
  c.put(69, 36, 'enp6s0', COLOR.text);
  c.put(76, 36, 'n', COLOR.red);
  c.put(77, 36, '>', COLOR.red);

  c.put(1, 37, '600G', COLOR.label);
  c.put(1, 47, '0', COLOR.label);
  c.graph(5, 37, 44, 10, s.down, COLOR.blue);

  c.box(52, 37, 33, 12, COLOR.border.net);
  c.put(54, 37, 'download', COLOR.text);
  // 速率格式：GiB/s，後面附 Tbps；累計超過 1024 GiB 就換成 TiB
  const gibps = (r: number) => `${r.toFixed(1)} GiB/s (${(r * 8.59 / 1000).toFixed(2)} Tbps)`;
  const total = (g: number) => (g >= 1024 ? `${(g / 1024).toFixed(1)} TiB` : `${g.toFixed(0)} GiB`);
  const downRate = s.down[s.down.length - 1] * 6;
  const upRate = s.up[s.up.length - 1] * 6;
  c.put(54, 39, `▼ ${gibps(downRate)}`, COLOR.text);
  c.put(54, 40, `▼ Top: (${s.downTop.toFixed(1)} GiB/s)`, COLOR.text);
  c.put(54, 41, `▼ Total: ${total(s.downTotal)}`, COLOR.text);
  c.put(54, 43, `▲ ${gibps(upRate)}`, COLOR.text);
  c.put(54, 44, `▲ Top: (${s.upTop.toFixed(1)} GiB/s)`, COLOR.text);
  c.put(54, 45, `▲ Total: ${total(s.upTotal)}`, COLOR.text);
  c.put(54, 48, 'upload', COLOR.text);

  // ── proc ─────────────────────────────────────────────
  c.box(87, 16, 102, 33, COLOR.border.proc);
  c.put(88, 16, '²', COLOR.red);
  c.put(89, 16, 'proc', COLOR.text);
  c.put(97, 16, 'filter', COLOR.text);
  c.put(146, 16, 'per-core', COLOR.text);
  c.put(155, 16, 'reverse', COLOR.text);
  c.put(164, 16, 'tree', COLOR.text);
  c.put(169, 16, '< memory >', COLOR.text);

  c.right(96, 17, 'Pid:', COLOR.text);
  c.put(98, 17, 'Program:', COLOR.text);
  c.put(117, 17, 'Command:', COLOR.text);
  c.right(150, 17, 'Threads:', COLOR.text);
  c.put(153, 17, 'User:', COLOR.text);
  c.right(170, 17, 'MemB', COLOR.text);
  c.right(185, 17, 'Cpu%', COLOR.text);
  c.put(186, 17, '▲', COLOR.text);

  // 行程很多時跟著選取的列捲動
  const offset = Math.max(0, s.selected - PROC_ROWS + 1);
  s.procs.slice(offset, offset + PROC_ROWS).forEach((p, i) => {
    const y = 18 + i;
    c.right(96, y, String(p.pid), COLOR.text);
    c.put(98, y, p.program.slice(0, 15), COLOR.green);
    c.put(117, y, p.command.slice(0, 25), COLOR.label);
    c.right(150, y, String(p.threads), COLOR.text);
    c.put(153, y, p.user.slice(0, 10), COLOR.green);
    c.right(170, y, p.memB, COLOR.text);
    c.right(185, y, fmt(p.cpu), COLOR.text);
  });
  if (s.procs.length > 0) c.highlight(88, 186, 18 + s.selected - offset, COLOR.select);

  // ── 彈出視窗：kill 確認 / 訊號選單 ───────────────────
  const selected = s.procs[s.selected];
  if (s.modal?.kind === 'confirm' && selected) {
    const { pid, signal } = s.modal;
    const proc = s.procs.find(p => p.pid === pid);
    const verb = signal === 'SIGKILL' ? 'Kill' : 'Terminate';
    const x = 63;
    c.fill(x, 21, 64, 5, COLOR.panel);
    c.box(x, 21, 64, 5, COLOR.border.proc);
    c.put(x + 2, 23, `${verb} ${proc?.program ?? pid} (PID ${pid}) with ${signal}? [y/N]`, COLOR.text);
  }
  if (s.modal?.kind === 'signals') {
    const x = 70;
    const h = SIGNALS.length + 4;
    const chosen = s.modal.index;
    c.fill(x, 12, 36, h, COLOR.panel);
    c.box(x, 12, 36, h, COLOR.border.proc);
    c.put(x + 2, 13, 'Send signal', COLOR.text);
    SIGNALS.forEach((sig, i) => {
      const y = 14 + i;
      c.put(x + 2, y, sig.name, COLOR.text);
      if (i === chosen) c.highlight(x + 1, x + 34, y, COLOR.select);
    });
  }

  // ── 底部：有通知就顯示通知，否則是操作列 ─────────────
  if (s.notice && now.getTime() < s.notice.until) {
    c.put(88, 49, s.notice.text, s.notice.color);
  } else {
    c.put(88, 49, '↑ select ↓ info ↵ terminate kill signals', COLOR.text);
  }
  c.right(186, 49, `${s.procs.length ? s.selected + 1 : 0}/${s.procs.length}`, COLOR.text);

  return c.rows();
};
