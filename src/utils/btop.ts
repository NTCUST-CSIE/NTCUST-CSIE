// 模擬 aristocratos/btop 的畫面，版面以截圖的 190 × 50 格對位。
// 數字是假的：CPU、溫度、網路、行程的 CPU% 會每秒飄動；
// 主機名稱、IP、使用者都換成虛構的值，不暴露真實機器資訊。

export const COLS = 190;
export const ROWS = 50;

const COLOR = {
  text: '#e6edf3',
  label: '#8b949e',
  dim: '#4b535c',
  empty: '#2b3038',
  green: '#7fd17f',
  yellow: '#e5c44a',
  red: '#e35d5d',
  blue: '#5b8fe0',
  orange: '#e0873a',
  cyan: '#56c8d8',
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
}
export type BtopRow = BtopRun[];

interface Cell {
  ch: string;
  color?: string;
}

// 一格一格的畫布，最後轉成帶顏色的列
class Canvas {
  private grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, (): Cell => ({ ch: ' ' })),
  );

  set(x: number, y: number, ch: string, color?: string) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    this.grid[y][x] = { ch, color };
  }

  put(x: number, y: number, text: string, color?: string) {
    [...text].forEach((ch, i) => this.set(x + i, y, ch, color));
  }

  // 文字靠右對齊，最後一個字落在 endX
  right(endX: number, y: number, text: string, color?: string) {
    this.put(endX - [...text].length + 1, y, text, color);
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
        if (last && last.color === cell.color) last.text += cell.ch;
        else runs.push({ text: cell.ch, color: cell.color });
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
  cpu: number;
  // 這一列的 CPU% 會飄動
  live?: boolean;
}

// 行程表照截圖排列，cpu 是靜態基準值
const PROCS: Proc[] = [
  { pid: 3426753, program: 'MainThread', command: 'node --require /usr/loc', threads: 12, user: 'guest', memB: '3T', cpu: 0 },
  { pid: 2012235, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 56, user: 'guest', memB: '2.3G', cpu: 0 },
  { pid: 3420079, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 129, user: 'guest', memB: '1.6G', cpu: 9.9, live: true },
  { pid: 3422005, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 92, user: 'guest', memB: '1.5G', cpu: 0 },
  { pid: 3276018, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 66, user: 'guest', memB: '1.5G', cpu: 0 },
  { pid: 2151981, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 45, user: 'guest', memB: '1.3G', cpu: 0 },
  { pid: 3422196, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 39, user: 'guest', memB: '1.3G', cpu: 0 },
  { pid: 3427061, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 90, user: 'guest', memB: '1.2G', cpu: 0 },
  { pid: 3425877, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 47, user: 'guest', memB: '791M', cpu: 0 },
  { pid: 3416374, program: 'python3', command: '/usr/local/bin/python3', threads: 67, user: 'root', memB: '732M', cpu: 0 },
  { pid: 3420084, program: 'java', command: 'java -Xms128M -XX:MaxRA', threads: 38, user: 'guest', memB: '623M', cpu: 0 },
  { pid: 3375361, program: 'systemd-journal', command: '/lib/systemd/systemd-jo', threads: 1, user: 'root', memB: '260M', cpu: 0 },
  { pid: 3427351, program: 'MainThread', command: 'node --require /usr/loc', threads: 12, user: 'guest', memB: '209M', cpu: 0 },
  { pid: 3427508, program: 'MainThread', command: 'node --require /usr/loc', threads: 12, user: 'guest', memB: '208M', cpu: 0 },
  { pid: 3427760, program: 'MainThread', command: 'node --require /usr/loc', threads: 32, user: 'guest', memB: '192M', cpu: 0 },
  { pid: 1165343, program: 'MainThread', command: 'node --require /usr/loc', threads: 12, user: 'guest', memB: '183M', cpu: 0 },
  { pid: 881274, program: 'fwupd', command: '/usr/libexec/fwupd/fwup', threads: 5, user: 'root', memB: '157M', cpu: 0 },
  { pid: 3415964, program: 'dockerd', command: '/usr/bin/dockerd -H fd:', threads: 97, user: 'root', memB: '128M', cpu: 0 },
  { pid: 1036, program: 'zerotier-one', command: '/usr/sbin/zerotier-one', threads: 49, user: 'zerotier', memB: '102M', cpu: 0 },
  { pid: 991, program: 'node', command: '/opt/node-v20.12.2-linu', threads: 11, user: 'root', memB: '82M', cpu: 0 },
  { pid: 547397, program: 'python', command: '/usr/local/bin/python /', threads: 4, user: 'guest', memB: '80M', cpu: 0 },
  { pid: 3388622, program: 'containerd', command: '/usr/bin/containerd', threads: 27, user: 'root', memB: '55M', cpu: 0 },
  { pid: 990, program: 'node', command: '/opt/node-v20.12.2-linu', threads: 11, user: 'root', memB: '54M', cpu: 0 },
  { pid: 3417009, program: 'wings', command: '/usr/local/bin/wings', threads: 27, user: 'root', memB: '53M', cpu: 0 },
  { pid: 812, program: 'sshd', command: 'sshd: /usr/sbin/sshd -D', threads: 1, user: 'root', memB: '42M', cpu: 0 },
  { pid: 903, program: 'rsyslogd', command: '/usr/sbin/rsyslogd -n', threads: 4, user: 'root', memB: '38M', cpu: 0 },
  { pid: 1190, program: 'mysqld', command: '/usr/sbin/mysqld', threads: 36, user: 'mysql', memB: '31M', cpu: 0 },
  { pid: 1044, program: 'nginx', command: 'nginx: master process', threads: 1, user: 'root', memB: '18M', cpu: 0 },
  { pid: 1402, program: 'php-fpm', command: 'php-fpm: pool www', threads: 1, user: 'www-data', memB: '14M', cpu: 0 },
  { pid: 3520, program: 'cron', command: '/usr/sbin/cron -f', threads: 1, user: 'root', memB: '6M', cpu: 0 },
];

const CORE_COUNT = 20;
const CPU_HIST = 66;
const CORE_HIST = 9;
const NET_HIST = 44;

export interface BtopState {
  cpu: number[];
  cores: number[];
  coreHist: number[][];
  tempHist: number[][];
  down: number[];
  up: number[];
  procCpu: number[];
}

const filled = (n: number, v: number) => Array<number>(n).fill(v);

export const createBtop = (): BtopState => ({
  cpu: filled(CPU_HIST, 2),
  cores: filled(CORE_COUNT, 2),
  coreHist: Array.from({ length: CORE_COUNT }, () => filled(CORE_HIST, 2)),
  tempHist: Array.from({ length: CORE_COUNT }, () => filled(CORE_HIST, 22)),
  down: filled(NET_HIST, 10),
  up: filled(NET_HIST, 6),
  procCpu: PROCS.map(p => p.cpu),
});

const push = (arr: number[], v: number) => {
  arr.shift();
  arr.push(v);
};

// 每秒呼叫一次：數值往目標附近飄，不會突然跳到天邊
export const stepBtop = (s: BtopState) => {
  const drift = (prev: number, target: number, spread: number) =>
    clamp(prev + (target - prev) * 0.4 + (Math.random() - 0.5) * spread, 0, 100);

  push(s.cpu, drift(s.cpu[s.cpu.length - 1], 4, 14));
  s.cores = s.cores.map(c => drift(c, 6, 30));
  s.cores.forEach((c, i) => push(s.coreHist[i], c));
  s.tempHist.forEach(h => push(h, clamp(h[h.length - 1] + (Math.random() - 0.5) * 3, 10, 40)));
  push(s.down, drift(s.down[s.down.length - 1], 14, 26));
  push(s.up, drift(s.up[s.up.length - 1], 8, 16));
  s.procCpu = s.procCpu.map((c, i) => (PROCS[i].live ? clamp(c + (Math.random() - 0.5) * 4, 2, 15) : 0));
};


export const renderBtop = (s: BtopState, now: Date): BtopRow[] => {
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

  c.graph(3, 2, 66, 11, s.cpu);
  c.put(3, 14, 'up 61d 22:14', COLOR.label);

  // 右側的 CPU 面板
  c.box(72, 1, 117, 14, COLOR.border.cpu);
  c.put(75, 1, 'E5-2660', COLOR.text);
  c.right(186, 1, '1.6 GHz', COLOR.text);

  c.put(74, 3, 'CPU', COLOR.label);
  c.bar(78, 3, 88, cpuNow, COLOR.green);
  c.right(171, 3, `${cpuNow}%`, COLOR.text);
  c.put(179, 3, `${Math.round(25 + s.tempHist[0][s.tempHist[0].length - 1] * 0.3)}°C`, COLOR.blue);

  for (let k = 0; k < CORE_COUNT; k++) {
    const block = k < 7 ? 0 : k < 14 ? 1 : 2;
    const idx = k < 7 ? k : k < 14 ? k - 7 : k - 14;
    const x0 = 73 + block * 38;
    const y = 4 + idx;
    const pct = s.cores[k];
    const temp = Math.round(25 + s.tempHist[k][s.tempHist[k].length - 1] * 0.3);
    c.put(x0, y, `C${k}`, COLOR.text);
    c.graph(x0 + 3, y, 9, 1, s.coreHist[k]);
    c.right(x0 + 16, y, `${Math.round(pct)}%`, COLOR.text);
    c.graph(x0 + 19, y, 8, 1, s.tempHist[k], COLOR.blue);
    c.put(x0 + 28, y, `${temp}°C`, COLOR.blue);
  }

  c.put(150, 13, 'Load AVG:', COLOR.label);
  c.put(164, 13, '1.23', COLOR.text);
  c.put(171, 13, '1.06', COLOR.text);
  c.put(177, 13, '1.04', COLOR.text);

  // ── mem ──────────────────────────────────────────────
  c.box(1, 16, 42, 20, COLOR.border.mem);
  c.put(2, 16, '²', COLOR.red);
  c.put(3, 16, 'mem', COLOR.text);
  const memRows: [number, string, string, string, string][] = [
    [18, 'Total:', '62.6 GiB', '', ''],
    [19, 'Used:', '18.7 GiB', '30%', COLOR.red],
    [23, 'Available:', '43.9 GiB', '70%', COLOR.orange],
    [27, 'Cached:', '16.1 GiB', '26%', COLOR.cyan],
    [31, 'Free:', '26.2 GiB', '42%', COLOR.green],
  ];
  memRows.forEach(([y, label, size, pct, color], i) => {
    c.put(2, y, label, COLOR.text);
    c.right(40, y, size, COLOR.text);
    if (!pct) return;
    c.put(3, y + 1, pct, COLOR.text);
    // 每一項的小曲線：用 cpu 歷史做出不同的起伏
    const hist = s.cpu.map(v => clamp(v * (1 + i * 0.5), 0, 100));
    c.graph(31, y, 10, 2, hist, color);
  });

  // ── disks ────────────────────────────────────────────
  c.box(42, 16, 44, 20, COLOR.border.mem);
  c.put(43, 16, '³', COLOR.red);
  c.put(44, 16, 'disks', COLOR.text);
  c.put(79, 16, 'io', COLOR.text);
  const disks: [number, string, string, [string, number, string][]][] = [
    [18, 'root', '1.78 TiB', [['IO%', 0, ''], ['Used:', 18, '330 GiB'], ['Free:', 82, '1.46 TiB']]],
    [23, 'swap', '135 GiB', [['Used:', 1, '1.76 GiB'], ['Free:', 99, '134 GiB']]],
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
      c.put(51, row, `${pct}%`, COLOR.text);
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

  c.put(1, 37, '23K', COLOR.label);
  c.put(1, 47, '372K', COLOR.label);
  c.graph(5, 37, 44, 10, s.down, COLOR.blue);

  c.box(52, 37, 33, 12, COLOR.border.net);
  c.put(54, 37, 'download', COLOR.text);
  const kib = (v: number) => Math.round(v * 1.2);
  c.put(54, 39, `▼ ${kib(s.down[s.down.length - 1])} KiB/s (${Math.round(kib(s.down[s.down.length - 1]) * 8.2)} Kbps)`, COLOR.text);
  c.put(54, 40, '▼ Top: (525 Kbps)', COLOR.text);
  c.put(54, 41, '▼ Total: 501 GiB', COLOR.text);
  c.put(54, 43, `▲ ${kib(s.up[s.up.length - 1])} KiB/s (${(kib(s.up[s.up.length - 1]) * 8.2 / 1000).toFixed(2)} Mibps)`, COLOR.text);
  c.put(54, 44, '▲ Top: (3.14 Mibps)', COLOR.text);
  c.put(54, 45, '▲ Total: 760 GiB', COLOR.text);
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

  PROCS.forEach((p, i) => {
    const y = 18 + i;
    if (y > 47) return;
    const cpu = s.procCpu[i];
    c.right(96, y, String(p.pid), COLOR.text);
    c.put(98, y, p.program.slice(0, 15), COLOR.green);
    c.put(117, y, p.command.slice(0, 25), COLOR.label);
    c.right(150, y, String(p.threads), COLOR.text);
    c.put(153, y, p.user.slice(0, 10), COLOR.green);
    c.right(170, y, p.memB, COLOR.text);
    c.right(185, y, cpu.toFixed(1), COLOR.text);
  });

  c.put(88, 49, '↑ select ↓ info ↵ terminate kill signals', COLOR.text);
  c.right(186, 49, `0/${PROCS.length}`, COLOR.text);

  return c.rows();
};
