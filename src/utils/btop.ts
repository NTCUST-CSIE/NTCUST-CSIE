// 模擬 btop 的畫面。數字是假的，但每秒會慢慢跳動，看起來像真的在跑
const W = 78;
const INNER = W - 2;
const CORES = 8;
const HISTORY = 40;
const GRAPH = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export interface BtopState {
  history: number[];
  cores: number[];
  mem: number;
  rx: number;
  tx: number;
}

interface Proc {
  pid: number;
  user: string;
  cmd: string;
  base: number;
  mem: number;
}

const PROCS: Proc[] = [
  { pid: 1, user: 'root', cmd: '/sbin/init splash', base: 0.1, mem: 0.2 },
  { pid: 812, user: 'root', cmd: 'sshd: /usr/sbin/sshd -D', base: 0, mem: 0.1 },
  { pid: 903, user: 'root', cmd: '/usr/sbin/rsyslogd -n', base: 0.1, mem: 0.1 },
  { pid: 1044, user: 'www-data', cmd: 'nginx: master process', base: 0.2, mem: 0.1 },
  { pid: 1045, user: 'www-data', cmd: 'nginx: worker process', base: 0.8, mem: 0.3 },
  { pid: 1190, user: 'mysql', cmd: '/usr/sbin/mysqld', base: 2.4, mem: 9.8 },
  { pid: 1337, user: 'csie', cmd: 'node /srv/csie/server.js', base: 6.2, mem: 4.1 },
  { pid: 1402, user: 'www-data', cmd: 'php-fpm: pool www', base: 1.1, mem: 1.6 },
  { pid: 2201, user: 'root', cmd: '/usr/bin/dockerd -H fd://', base: 0.9, mem: 2.2 },
  { pid: 3317, user: 'www-data', cmd: 'python3 /srv/csie/crawler.py', base: 3.5, mem: 0.9 },
  { pid: 3520, user: 'root', cmd: '/usr/sbin/cron -f', base: 0, mem: 0.1 },
  { pid: 4011, user: 'guest', cmd: 'bash', base: 0, mem: 0.1 },
  { pid: 4096, user: 'guest', cmd: 'btop', base: 1.3, mem: 0.4 },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const bar = (pct: number, width: number) => {
  const filled = Math.round((clamp(pct, 0, 100) / 100) * width);
  return '█'.repeat(filled) + ' '.repeat(width - filled);
};

const fit = (s: string, n: number) => {
  const t = s.length > n ? s.slice(0, n) : s;
  return t + ' '.repeat(n - t.length);
};

const boxTop = (title: string) => {
  const head = `─ ${title} `;
  return '┌' + head + '─'.repeat(INNER - head.length) + '┐';
};

const boxBottom = () => '└' + '─'.repeat(INNER) + '┘';

const boxRow = (content: string) => '│' + fit(' ' + content, INNER) + '│';

const pct3 = (n: number) => `${Math.round(n)}`.padStart(3) + '%';

export const createBtop = (): BtopState => ({
  history: Array<number>(HISTORY).fill(20),
  cores: Array<number>(CORES).fill(18),
  mem: 6.2,
  rx: 120,
  tx: 40,
});

// 每秒呼叫一次：數值往目標附近飄，不會突然跳到天邊
export const stepBtop = (s: BtopState) => {
  const drift = (prev: number, target: number, spread: number) =>
    clamp(prev + (target - prev) * 0.35 + (Math.random() - 0.5) * spread, 0, 100);

  s.history.shift();
  s.history.push(drift(s.history[s.history.length - 1], 24, 30));
  s.cores = s.cores.map(c => drift(c, 24, 40));
  s.mem = clamp(s.mem + (Math.random() - 0.5) * 0.1, 5.8, 7.4);
  s.rx = Math.max(10, s.rx + (Math.random() - 0.5) * 80);
  s.tx = Math.max(5, s.tx + (Math.random() - 0.5) * 30);
};

export const renderBtop = (s: BtopState, now: Date) => {
  const time = now.toTimeString().slice(0, 8);
  const cpu = s.history[s.history.length - 1];
  const load = (cpu / 100 * 2.4).toFixed(2);
  const memTotal = 15.6;
  const memPct = (s.mem / memTotal) * 100;

  const header = fit(' btop++ v1.3.2', W - `${time}  up 412d 06:18 `.length) + `${time}  up 412d 06:18 `;

  const graph = s.history.map(v => GRAPH[Math.round((v / 100) * (GRAPH.length - 1))]).join('');

  const coreCells = s.cores.map((c, i) => `${i} [${bar(c, 6)}] ${pct3(c)}`);
  const coreRows = [0, 1].map(r => boxRow(coreCells.slice(r * 4, r * 4 + 4).join('   ')));

  const procs = PROCS
    .map(p => ({ ...p, cpu: p.base * (0.6 + Math.random() * 0.8) }))
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 10)
    .map(p =>
      boxRow(
        `${String(p.pid).padStart(6)} ${p.user.padEnd(9)} ${p.cpu.toFixed(1).padStart(5)} ${p.mem.toFixed(1).padStart(5)}  ${p.cmd}`,
      ),
    );

  return [
    header,
    boxTop('cpu'),
    boxRow(`${pct3(cpu)} ${graph}  load ${load}`),
    ...coreRows,
    boxBottom(),
    boxTop('mem'),
    boxRow(`Mem  [${bar(memPct, 36)}] ${s.mem.toFixed(1)}G / ${memTotal}G`),
    boxRow(`Swap [${bar(0, 36)}] 0.0G / 4.0G`),
    boxRow(`Disk [${bar(42, 36)}] / 42%`),
    boxRow(`Net  rx ${Math.round(s.rx)} KiB/s   tx ${Math.round(s.tx)} KiB/s`),
    boxBottom(),
    boxTop('proc'),
    boxRow(`${'PID'.padStart(6)} ${'USER'.padEnd(9)} ${'CPU%'.padStart(5)} ${'MEM%'.padStart(5)}  COMMAND`),
    ...procs,
    boxBottom(),
    ` esc menu   q quit   f filter   p pause`,
  ].join('\n');
};
