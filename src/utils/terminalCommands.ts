import membersData from '../data/members.json';
import eventsData from '../data/events.json';
import financeData from '../data/finance.json';
import { crashSite, discoverEgg, getFoundEggs, hiddenEggs, mainEggs, requestTheme } from './eggs';
import type { Egg } from './eggs';

export type LineKind = 'input' | 'output' | 'error' | 'accent' | 'train';
export type TerminalMode = 'shell' | 'password' | 'vim' | 'btop';

export interface TerminalApi {
  print: (text: string, kind?: LineKind) => void;
  printSequence: (lines: string[], interval: number, onDone?: () => void) => void;
  printTimeline: (steps: TimedLine[], onDone?: () => void, pause?: number) => void;
  clear: () => void;
  close: () => void;
  navigate: (path: string) => void;
  setMode: (mode: TerminalMode) => void;
}

export interface TimedLine {
  delay: number;
  text: string;
  kind?: LineKind;
}

export interface TerminalSession {
  mode: TerminalMode;
  history: string[];
  sudoCommand: string;
  sudoFails: number;
  vimTries: number;
}

interface Department {
  departmentTitle: string;
  members: { name: string; title: string; intro: string }[];
}

interface EventItem {
  title: string;
  desc: string;
  links: { text: string | null; url: string | null }[];
}

const departments = membersData as Department[];
const eventEntries = Object.entries(eventsData as Record<string, EventItem>);
const memberNames = [...new Set(departments.flatMap(d => d.members.map(m => m.name)))];

// 同一個人可能在兩個部門（例如兼任），職位要一起列出來
const rolesOf = (name: string) =>
  departments.flatMap(d => d.members.filter(m => m.name === name).map(m => ({ ...m, dept: d.departmentTitle })));

// members.json 的自我介紹是 HTML，終端機只顯示純文字
const htmlToText = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();

// events/ 資料夾：檔名用 events.json 的 key，也可以直接打活動名稱
const findEvent = (name: string) => {
  const key = name.replace(/^(\.\/)?events\//, '').replace(/\/$/, '').toLowerCase();
  return eventEntries.find(([id, e]) => id.toLowerCase() === key || e.title === key);
};

const showEvent = ([id, e]: [string, EventItem]) => {
  const links = e.links.filter(l => l.text && l.url).map(l => `  • ${l.text}：${l.url}`);
  return [
    `# ${e.title}（events/${id}）`,
    e.desc,
    '',
    links.length > 0 ? `相關連結：\n${links.join('\n')}` : '相關連結：目前沒有',
    '',
    '在網站上看：cd events',
  ].join('\n');
};

const isEventsDir = (path: string) => /^(\.\/)?events\/?$/.test(path);

interface Semester {
  total: { income: number | null; expense: number | null; balance: number | null };
}

// CTF 第 3 關的 dev-notes.txt 裡寫著這個密碼
const SUDO_PASSWORD = 'hunter2';

// 「' or …」或是註解符號 --、分號接指令，這些都是 SQL 注入常見的寫法
const looksLikeSqlInjection = (text: string) =>
  /'\s*or\s/i.test(text) || /--\s*$/.test(text) || /;\s*(drop|select|delete|insert|update)\b/i.test(text);

const logo = String.raw`  ____ ____ ___ _____
 / ___/ ___|_ _| ____|
| |   \___ \| ||  _|
| |___ ___) | || |___
 \____|____/___|_____|`;

const train = String.raw`      ====        ________                ___________
  _D _|  |_______/        \__I_I_____===__|_________|
   |(_)---  |   H\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__
__/ =| o |=-~~\  /~~\  /~~\  /~~\ ____Y___________|__
 |/-=|___|=    ||    ||    ||    |_____/~\___/
  \_/      \O=====O=====O=====O_/      \_/`;

const teapot = [
  'HTTP/1.1 418 I\'m a teapot',
  '',
  '        ( (',
  '         ) )',
  '      ........',
  '      |      |]',
  '      \\      /',
  '       `----\'',
  '',
  '🫖 我是茶壺，不能煮咖啡。（RFC 2324）',
].join('\n');

const cat = String.raw`  /\_/\
 ( o.o )  meow~~
  > ^ <`;

const fortunes = [
  'It works on my machine. 🤷',
  '電腦科學只有兩件難事：快取失效和命名。 —— Phil Karlton',
  'Talk is cheap. Show me the code. —— Linus Torvalds',
  'Make it work, make it right, make it fast. —— Kent Beck',
  '程式裡有 99 個 bug，修掉一個，現在有 127 個 bug。',
  'Deadline 是第一生產力。',
  '睡一覺起來，bug 就自己找到了。',
  '今天寫的 TODO，就是明天的 legacy code。',
  '別擔心，你的 code 沒有 bug，只是有一些沒寫進文件的 feature。',
];

// 公開指令的說明，help 和 man 都從這裡產生；隱藏指令（彩蛋）不放進來，所以也查不到
interface CommandDoc {
  synopsis: string;
  summary: string;
  details?: string[];
}

const firstMember = memberNames[0] ?? '';

const docs: Record<string, CommandDoc> = {
  btop: { synopsis: 'btop', summary: '即時監看伺服器的 CPU、記憶體和行程。', details: ['↑↓ 選擇行程，Enter 或 t 結束行程，k 強制結束，s 選擇要送出的訊號，q 或 Esc 離開。'] },
  cat: { synopsis: 'cat file', summary: '印出檔案內容。', details: ['例：cat about.txt、cat events/Theme_Courses'] },
  cd: { synopsis: 'cd [page]', summary: '前往網站上的頁面。', details: ['page 可以是 members、events、finance、feedback、flag；不加參數或 cd ~ 回首頁。'] },
  clear: { synopsis: 'clear', summary: '清除畫面。' },
  cowsay: { synopsis: 'cowsay [text]', summary: '讓一頭牛幫你說話。' },
  ctf: { synopsis: 'ctf', summary: '顯示 CSIE CTF 的規則和起點。' },
  date: { synopsis: 'date', summary: '顯示現在的臺灣時間。' },
  echo: { synopsis: 'echo [arg ...]', summary: '把參數原封不動印出來。' },
  eggs: { synopsis: 'eggs', summary: '顯示彩蛋收集進度和提示。' },
  exit: { synopsis: 'exit', summary: '離開終端機。' },
  finger: { synopsis: 'finger [name]', summary: '顯示科會成員的職位和自我介紹。', details: ['不加名字會列出所有成員。', `例：finger ${firstMember}`] },
  fortune: { synopsis: 'fortune', summary: '隨機印出一句工程師語錄。' },
  help: { synopsis: 'help [name]', summary: '顯示內建指令的說明。', details: ['不加參數會列出所有指令；加上指令名稱會顯示該指令的詳細用法。'] },
  history: { synopsis: 'history', summary: '列出輸入過的指令。' },
  id: { synopsis: 'id', summary: '顯示使用者編號和所屬群組。' },
  ls: { synopsis: 'ls [-a] [-l] [dir]', summary: '列出檔案。', details: ['-a    連隱藏檔（. 開頭）一起列出', '-l    顯示權限和擁有者', '例：ls -la、ls events/'] },
  man: { synopsis: 'man name', summary: '顯示指令的使用手冊。' },
  members: { synopsis: 'members', summary: '列出科會各部門的成員。' },
  meow: { synopsis: 'meow', summary: '召喚一隻貓。' },
  neofetch: { synopsis: 'neofetch', summary: '顯示系統資訊。' },
  pwd: { synopsis: 'pwd', summary: '顯示目前所在的資料夾。' },
  theme: { synopsis: 'theme [dark|light]', summary: '切換網站的深色 / 淺色主題。', details: ['不加參數會顯示目前的主題。'] },
  uname: { synopsis: 'uname [-a]', summary: '顯示系統名稱。', details: ['-a    顯示完整的系統資訊'] },
  uptime: { synopsis: 'uptime', summary: '顯示你在這個網站待了多久。' },
  whoami: { synopsis: 'whoami', summary: '顯示目前的使用者名稱。' },
};

const docNames = Object.keys(docs).sort();

// 仿 bash 的 help：開頭幾行說明，接著兩欄、依字母直向排列的指令
const helpList = () => {
  const rows = Math.ceil(docNames.length / 2);
  const lines = Array.from({ length: rows }, (_, r) => {
    const left = docs[docNames[r]].synopsis;
    const right = docNames[r + rows] ? docs[docNames[r + rows]].synopsis : '';
    return ` ${left.padEnd(40)}${right}`.trimEnd();
  });
  return [
    'csie-sh，版本 8.0.0(1)-release (x86_64-csie-linux-gnu)',
    '這些 shell 命令是內部定義的。輸入「help」以取得本列表。',
    '輸入「help 名稱」以取得有關命令「名稱」的更多資訊。',
    '使用「man 名稱」來閱讀命令的使用手冊。',
    '',
    ...lines,
  ].join('\n');
};

const showHelp = (api: TerminalApi, topic?: string) => {
  if (!topic) {
    api.print(helpList());
    api.print('（還有一些不能給你看的指令，自己找找看 👀）', 'accent');
    return;
  }
  const doc = docs[topic];
  if (!doc) {
    api.print(`csie-sh: help: 沒有與「${topic}」相符的說明主題。請試試「help help」。`, 'error');
    return;
  }
  const body = [doc.summary, ...(doc.details ? ['', ...doc.details] : [])];
  api.print(`${topic}: ${doc.synopsis}\n${body.map(line => (line ? `    ${line}` : '')).join('\n')}`);
};

// 仿 man page：標題列、NAME、SYNOPSIS、DESCRIPTION
const showMan = (api: TerminalApi, topic?: string) => {
  if (!topic) {
    api.print("What manual page do you want?\nFor example, try 'man man'.");
    return;
  }
  const doc = docs[topic];
  if (!doc) {
    api.print(`No manual entry for ${topic}`, 'error');
    return;
  }
  const tag = `${topic.toUpperCase()}(1)`;
  const title = 'CSIE Terminal Manual';
  const gap = Math.max(1, Math.floor((78 - tag.length * 2 - title.length) / 2));
  const indent = (lines: string[]) => lines.map(line => `       ${line}`).join('\n');
  api.print([
    `${tag}${' '.repeat(gap)}${title}${' '.repeat(gap)}${tag}`,
    '',
    'NAME',
    indent([`${topic} - ${doc.summary.replace(/。$/, '')}`]),
    '',
    'SYNOPSIS',
    indent([doc.synopsis]),
    '',
    'DESCRIPTION',
    indent(doc.details ?? [doc.summary]),
  ].join('\n'));
};

const completions = docNames;

const pages: Record<string, string> = {
  '': '/', '~': '/', '/': '/', '..': '/', home: '/',
  members: '/members', events: '/events', finance: '/finance', feedback: '/feedback', flag: '/flag',
};

const publicFiles = ['README.md', 'about.txt', 'events.json', 'finance.json', 'members.json'];
const hiddenFiles = ['.bash_history', '.flag'];

const formatAmount = (num: number | null) => (num === null ? '尚未結算' : `NT$ ${num.toLocaleString('en-US')}`);

const readFile = (name: string): string | null => {
  switch (name) {
    case 'README.md':
      return '# CSIE Terminal\n這是一台真的假終端機??\n輸入 help 查看指令。';
    case 'about.txt':
      return '我們是國立臺中科技大學 資訊工程科 科學會。\n由一群充滿熱情與活力的學生組成，致力於舉辦各項活動，\n協助大家在五專留下美好的回憶。';
    case 'members.json':
      return departments
        .map(d => `${d.departmentTitle}：${d.members.map(m => `${m.name}（${m.title}）`).join('、')}`)
        .join('\n');
    case 'events.json':
      return Object.values(eventsData).map(e => `• ${e.title}`).join('\n') + '\n\n試試 cd events';
    case 'finance.json':
      return Object.entries(financeData as Record<string, Semester>)
        .map(([key, s]) => `${key} 學期｜收入 ${formatAmount(s.total.income)}｜支出 ${formatAmount(s.total.expense)}｜結餘 ${formatAmount(s.total.balance)}`)
        .join('\n') + '\n\n試試 cd finance 比較快 :)';
    case '.bash_history':
      return 'ls\nls -a\ncat .flag\nsudo cat .flag\n# sudo 密碼是什麼...\nvim\n:q\n:q!\n:qqqqqq\nhow to exit vim';
    default:
      return null;
  }
};

const listFiles = (showAll: boolean, long: boolean) => {
  const entries: [string, string, string][] = [
    ...(showAll ? [
      ['.', 'drwxr-xr-x', 'guest'],
      ['..', 'drwxr-xr-x', 'root'],
      ['.bash_history', '-rw-------', 'guest'],
      ['.flag', '-r--------', 'root'],
    ] as [string, string, string][] : []),
    ['events/', 'drwxr-xr-x', 'guest'],
    ...publicFiles.map(f => [f, '-rw-r--r--', 'guest'] as [string, string, string]),
  ];
  if (!long) return entries.map(e => e[0]).join('  ');
  return entries.map(([name, perm, owner]) => `${perm}  1 ${owner.padEnd(5)} csie  ${name}`).join('\n');
};

// 中日韓文字在等寬字型裡佔兩格，算對話框寬度時要算進去
const displayWidth = (text: string) =>
  [...text].reduce((w, ch) => w + ((ch.codePointAt(0) ?? 0) > 0x2e80 ? 2 : 1), 0);

const cowsay = (text: string) => {
  const width = displayWidth(text);
  return [
    ' ' + '_'.repeat(width + 2),
    `< ${text} >`,
    ' ' + '-'.repeat(width + 2),
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ].join('\n');
};

const neofetch = () => {
  const memberCount = departments.reduce((n, d) => n + d.members.length, 0);
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const info = [
    'guest@csie',
    '----------',
    'OS: CSIE OS',
    'Host: 國立臺中科技大學 資訊工程科',
    'Kernel: React 19 + Vite',
    `Uptime: ${Math.floor(performance.now() / 60000)} 分鐘`,
    `Members: ${memberCount} 人 / ${departments.length} 個部門`,
    `Events: ${Object.keys(eventsData).length} 個`,
    'Shell: csie-sh',
    `Theme: ${theme}`,
  ];
  const logoLines = logo.split('\n');
  return info.map((line, i) => `${(logoLines[i] ?? '').padEnd(24)}${line}`).join('\n');
};

// rm -rf / 或 rm -rf /* 才是刪整台機器；家目錄裡的檔案跟單獨 rm 一樣是唯讀的
const wipesWholeSystem = (args: string[]) => {
  const flags = args.filter(a => a.startsWith('-')).join('');
  return flags.includes('r') && flags.includes('f') && args.some(a => a === '/' || a === '/*');
};

const showEggs = (api: TerminalApi) => {
  const found = getFoundEggs();
  const line = (e: Egg) => (found.includes(e.id) ? `  ✅ ${e.name}` : `  ⬜ ???　提示：${e.hint}`);
  api.print(`🥚 彩蛋收集進度：${mainEggs.filter(e => found.includes(e.id)).length}/${mainEggs.length}\n${mainEggs.map(line).join('\n')}`);
  if (hiddenEggs.length > 0) api.print(`🌟 隱藏彩蛋（不計入總數）\n${hiddenEggs.map(line).join('\n')}`);
};

// 刪整台機器的假輸出，仿 rm -v 的格式；delay 是跟上一行的間隔（毫秒），不是等間隔
const wipeTimeline: TimedLine[] = [
  { delay: 120, text: "removed '/home/guest/.bashrc'" },
  { delay: 90, text: "removed '/home/guest/.bash_history'" },
  { delay: 140, text: "removed '/home/guest/members.json'" },
  { delay: 80, text: "removed '/home/guest/finance.json'" },
  { delay: 60, text: "removed directory '/home/guest'" },
  { delay: 260, text: "rm: cannot remove '/var/lib/mysql/ibdata1': Device or resource busy", kind: 'error' },
  { delay: 110, text: "removed '/var/www/nutccsie.org/index.html'" },
  { delay: 70, text: "removed '/var/www/nutccsie.org/assets/app.8f3c1a.js'" },
  { delay: 70, text: "removed '/var/www/nutccsie.org/assets/app.8f3c1a.css'" },
  { delay: 150, text: "removed '/var/log/nginx/access.log'" },
  { delay: 400, text: "removed '/var/log/nginx/error.log'" },
  { delay: 90, text: "removed directory '/var/www/nutccsie.org/assets'" },
  { delay: 90, text: "removed directory '/var/www/nutccsie.org'" },
  { delay: 330, text: "rm: cannot remove '/proc/1/root': Operation not permitted", kind: 'error' },
  { delay: 120, text: "removed '/usr/lib/node_modules/npm/lib/cli.js'" },
  { delay: 50, text: "removed '/usr/lib/node_modules/npm/lib/utils/error-handler.js'" },
  { delay: 45, text: "removed '/usr/lib/node_modules/npm/lib/utils/output.js'" },
  { delay: 60, text: "removed '/usr/lib/node_modules/npm/node_modules/semver/semver.js'" },
  { delay: 900, text: "removed directory '/usr/lib/node_modules/npm'" },
  { delay: 260, text: "rm: cannot remove '/sys/kernel/debug': Device or resource busy", kind: 'error' },
  { delay: 200, text: "removed '/usr/bin/git'" },
  { delay: 160, text: "removed '/usr/bin/python3.11'" },
  { delay: 700, text: "removed '/bin/bash'" },
  { delay: 120, text: "removed '/bin/sh'" },
  { delay: 300, text: "removed '/lib/x86_64-linux-gnu/libc.so.6'" },
  { delay: 240, text: 'Connection to nutccsie.org closed.', kind: 'error' },
  { delay: 160, text: 'client_loop: send disconnect: Broken pipe', kind: 'error' },
];

// rm -rf / 不管有沒有 sudo 都會跑這段；最後停一下才進入「無法連上」
const wipeSystem = (api: TerminalApi) => {
  api.printTimeline(wipeTimeline, crashSite, 1600);
};

const serveCoffee = (api: TerminalApi) => {
  api.print(teapot);
  discoverEgg('coffee');
};

const runAsRoot = (command: string, api: TerminalApi, session: TerminalSession) => {
  const [cmd, ...args] = command.split(/\s+/);
  if (cmd === 'rm' && wipesWholeSystem(args)) {
    // 先拿到「刪庫跑路」再開始刪；刪完彩蛋紀錄會被清空（只留這顆），F5 回來後才被通報
    discoverEgg('rmrf');
    wipeSystem(api);
    return;
  }
  if (cmd === 'cat' && args[0] === '.flag') {
    api.print(`🚩 CSIE CTF 5/5：${atob('cGwzNHMzfQ==')}`, 'accent');
    api.print('把五片按照順序拼起來，到 /flag 提交吧！');
    return;
  }
  if (command === 'make me a sandwich') {
    api.print('Okay. 🥪');
    return;
  }
  if (cmd === 'whoami') {
    api.print('root');
    return;
  }
  if (cmd === 'su' || cmd === '-i' || cmd === '-s') {
    api.print('root shell 太危險了，只借你一行指令。');
    return;
  }
  runCommand(command, api, session);
};

export const handleInput = (raw: string, api: TerminalApi, session: TerminalSession) => {
  // btop 全螢幕時不接受指令，按鍵由 Terminal 元件處理
  if (session.mode === 'btop') return;

  if (session.mode === 'password') {
    if (raw === SUDO_PASSWORD) {
      session.sudoFails = 0;
      api.setMode('shell');
      runAsRoot(session.sudoCommand, api, session);
      return;
    }
    // SQL 注入的寫法也算一次錯誤密碼；回覆換成「這裡不是資料庫」，照樣計入三次
    const injected = looksLikeSqlInjection(raw);
    if (injected) discoverEgg('sqli');
    session.sudoFails += 1;
    if (session.sudoFails >= 3) {
      session.sudoFails = 0;
      api.setMode('shell');
      api.print('sudo: 3 incorrect password attempts', 'error');
      api.print('This incident will be reported. 🚨', 'error');
      discoverEgg('sudo');
      return;
    }
    api.print(
      injected ? 'sudo: 這裡不是資料庫。密碼欄位只做字串比對，不會替你執行 SQL。' : 'Sorry, try again.',
      'error',
    );
    api.print('[sudo] password for guest:');
    return;
  }

  if (session.mode === 'vim') {
    const exits = [':q', ':q!', ':wq', ':wq!', ':x', ':qa', ':qa!', 'ZZ'];
    if (exits.includes(raw.trim())) {
      api.setMode('shell');
      api.print('恭喜你離開 Vim！這比解 CTF 還難 😇', 'accent');
      discoverEgg('vim');
      return;
    }
    const replies = [
      `E492: Not an editor command: ${raw}`,
      '你確定這樣出得去嗎？',
      'Stack Overflow 上「怎麼離開 Vim」這題已經被看了幾百萬次了……',
      '提示：輸入冒號開頭的指令試試',
    ];
    api.print(replies[session.vimTries % replies.length], 'error');
    session.vimTries += 1;
    return;
  }

  const command = raw.trim();
  if (!command) return;
  session.history.push(command);
  runCommand(command, api, session);
};

export const runCommand = (command: string, api: TerminalApi, session: TerminalSession) => {
  const [cmd, ...args] = command.split(/\s+/);
  const lower = cmd.toLowerCase();

  switch (lower) {
    case 'help':
      showHelp(api, args[0]);
      return;
    case 'ls':
    case 'dir': {
      const opts = args.filter(a => a.startsWith('-')).join('');
      const target = args.find(a => !a.startsWith('-'));
      if (target && isEventsDir(target)) {
        api.print(eventEntries.map(([id]) => id).join('  '));
      } else if (!target || ['.', './', '~', '~/'].includes(target)) {
        api.print(listFiles(opts.includes('a'), opts.includes('l')));
      } else {
        api.print(`ls: cannot access '${target}': No such file or directory`, 'error');
      }
      return;
    }
    case 'sl':
      api.print(train, 'train');
      api.print('（你是不是想打 ls？）');
      discoverEgg('sl');
      return;
    case 'cat': {
      const file = args[0];
      if (!file) {
        api.print('那個……我不會通靈（如果你要的是貓，輸入 meow）', 'error');
        return;
      }
      if (file === '.flag') {
        api.print('cat: .flag: Permission denied', 'error');
        return;
      }
      if (isEventsDir(file)) {
        api.print(`cat: ${file}: Is a directory（試試 ls events/）`, 'error');
        return;
      }
      if (/^(\.\/)?events\//.test(file)) {
        const event = findEvent(file);
        if (event) api.print(showEvent(event));
        else api.print(`cat: ${file}: No such file or directory`, 'error');
        return;
      }
      if (file === '/etc/passwd') {
        api.print('root:x:0:0:這個不能給你看:/root:/bin/bash\nguest:x:1000:1000:就是你:/home/guest:/bin/csie-sh');
        return;
      }
      const content = readFile(file);
      if (content === null) api.print(`cat: ${file}: No such file or directory`, 'error');
      else api.print(content);
      return;
    }
    case 'cd': {
      const target = (args[0] ?? '').replace(/^\.?\//, '').replace(/\/$/, '').toLowerCase();
      const path = pages[target];
      if (path === undefined) {
        api.print(`cd: no such file or directory: ${args[0]}`, 'error');
        return;
      }
      api.navigate(path);
      api.print(`→ 已前往 ${path}`);
      return;
    }
    case 'pwd':
      api.print('/home/guest');
      return;
    case 'whoami':
      api.print(args.includes('--real') ? '一個好奇心很強的訪客 :)' : 'guest');
      return;
    case 'members':
      api.print(departments.map(d => `${d.departmentTitle}\n${d.members.map(m => `  ${m.name}（${m.title}）`).join('\n')}`).join('\n\n'));
      api.print('（finger <名字> 看自我介紹、cd members 看成員頁）', 'accent');
      return;
    case 'finger': {
      const name = args.join(' ').trim();
      if (!name) {
        const rows = memberNames.map(n => `${n.padEnd(4, '　')}  ${rolesOf(n).map(r => r.title).join('、')}`);
        api.print(`${'Login'.padEnd(10)}Title\n${rows.join('\n')}`);
        return;
      }
      const roles = rolesOf(name);
      if (roles.length === 0) {
        api.print(`finger: ${name}: no such user.`, 'error');
        return;
      }
      api.print([
        `Login: ${name}`,
        `Title: ${roles.map(r => `${r.dept} ${r.title}`).join('、')}`,
        'Plan:',
        htmlToText(roles[0].intro),
      ].join('\n'));
      return;
    }
    case 'id':
      api.print('uid=1000(guest) gid=1000(csie) groups=1000(csie),27(想當sudo)');
      return;
    case 'echo':
      api.print(args.join(' '));
      return;
    case 'date':
      api.print(new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }));
      return;
    case 'uptime':
      api.print(`up ${Math.floor(performance.now() / 60000)} 分鐘 —— 你已經在這個網站待這麼久了 👀`);
      return;
    case 'uname':
      api.print(args.includes('-a') ? 'CSIE-OS csie 8.0.0 #1 SMP React19 Vite x86_64 GNU/Linux' : 'CSIE-OS');
      return;
    case 'history':
      api.print(session.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n'));
      return;
    case 'clear':
    case 'cls':
      api.clear();
      return;
    case 'exit':
    case 'quit':
    case 'logout':
      api.close();
      return;
    case 'neofetch':
      api.print(neofetch(), 'accent');
      return;
    case 'fortune':
      api.print(fortunes[Math.floor(Math.random() * fortunes.length)]);
      return;
    case 'cowsay':
      api.print(cowsay(args.join(' ') || 'Moo~ 輸入 cowsay <文字> 讓我說話'));
      return;
    case 'meow':
      api.print(cat);
      return;
    case 'theme': {
      const theme = args[0];
      if (theme === 'dark' || theme === 'light') {
        requestTheme(theme);
        api.print(`主題已切換為 ${theme}`);
      } else {
        api.print(`目前主題：${document.documentElement.getAttribute('data-theme') || 'dark'}（用法：theme dark | theme light）`);
      }
      return;
    }
    case 'eggs':
      showEggs(api);
      return;
    case 'ctf':
      api.print([
        '🚩 CSIE CTF',
        '資訊部把一面旗子拆成 5 片，藏在這個網站的各個角落。',
        '• 不需要攻擊任何伺服器，所有線索都在你的瀏覽器裡找得到',
        '• Flag 格式：CSIE{...}',
        '• 規則、提示與提交：輸入 cd flag，或前往 /flag',
        '• 第一片在哪？試試開發人員工具（F12）',
      ].join('\n'), 'accent');
      return;
    case 'sudo':
      if (args.length === 0) {
        api.print('usage: sudo <command>', 'error');
        return;
      }
      // 跟真的 sudo 一樣先問密碼，密碼對了才以 root 執行
      session.sudoCommand = args.join(' ');
      api.print('[sudo] password for guest:');
      api.setMode('password');
      return;
    case 'su':
      api.print('su: Authentication failure（試試 sudo？）', 'error');
      return;
    case 'rm':
      if (wipesWholeSystem(args)) {
        // 沒有 root 就刪不了：rm -rf / 會先被 GNU rm 的 preserve-root 擋下，硬關掉保護也只會權限不足
        if (args.includes('/') && !args.includes('--no-preserve-root')) {
          api.print("rm: it is dangerous to operate recursively on '/'", 'error');
          api.print('rm: use --no-preserve-root to override this failsafe', 'error');
        } else {
          api.print(`rm: cannot remove '${args.includes('/') ? '/' : '/bin'}': Permission denied`, 'error');
        }
      } else if (args.length === 0) {
        api.print('rm: missing operand', 'error');
      } else {
        api.print(`rm: cannot remove '${args[args.length - 1]}': Read-only file system`, 'error');
      }
      return;
    case 'btop':
      if (args.length > 0) {
        api.print(`btop: unrecognized option '${args[0]}'`, 'error');
        return;
      }
      api.setMode('btop');
      return;
    case 'vim':
    case 'vi':
    case 'nvim':
      api.print(`~\n~\n~\n~\n"${args[0] ?? '[No Name]'}" [New]\n-- NORMAL --`);
      api.setMode('vim');
      return;
    case 'emacs':
      api.print('這台機器只有 vim。（請不要在這裡引戰）');
      return;
    case 'nano':
      api.print('nano 是個好編輯器……可惜這裡只有 vim。輸入 vim 試試？');
      return;
    case 'coffee':
      serveCoffee(api);
      return;
    case 'make':
      if (args.join(' ') === 'coffee') {
        serveCoffee(api);
      } else if (args.join(' ') === 'me a sandwich') {
        api.print('What? Make it yourself.');
      } else {
        api.print('make: *** No targets specified and no makefile found.  Stop.', 'error');
      }
      return;
    case 'brew':
      if (args[0] === 'coffee') {
        serveCoffee(api);
      } else {
        api.print('brew: 我不是 macOS，我是 CSIE OS', 'error');
      }
      return;
    case 'hack':
    case 'hacker':
      api.printSequence([
        '[*] 正在連線到 mainframe…',
        '[*] 繞過防火牆…        ██████████ 100%',
        '[*] 破解管理員密碼…    ██████████ 100%',
        '[*] 下載 期末考答案.zip… ███████░░░  70%',
        '[!] ACCESS DENIED',
        '……開玩笑的。請把技術用在正途 😇',
      ], 500, () => discoverEgg('hack'));
      return;
    case 'git': {
      const sub = args.join(' ');
      if (args[0] === 'blame') api.print('看起來都是資訊部的錯 🙃');
      else if (sub.startsWith('push') && (args.includes('--force') || args.includes('-f'))) api.print('⚠️ 勇者，你確定要 force push 嗎？……已經幫你取消了，不用謝。', 'error');
      else api.print('fatal: not a git repository\n真正的 repo 在這：https://github.com/NTCUST-CSIE/NTCUST-CSIE', 'error');
      return;
    }
    case 'reboot':
    case 'shutdown':
    case 'poweroff':
      api.print('你沒有權限關掉我 😤', 'error');
      return;
    case 'man':
      showMan(api, args[0]);
      return;
    case 'ping':
      api.print('pong 🏓');
      return;
    case 'hello':
    case 'hi':
    case '你好':
    case '哈囉':
      api.print('哈囉！👋 歡迎來到 CSIE Terminal');
      return;
    case '42':
    case 'answer':
      api.print('生命、宇宙以及任何事情的終極答案。');
      return;
    default:
      api.print(`csie-sh: command not found: ${cmd}（輸入 help 查看可用指令）`, 'error');
  }
};

const commonPrefix = (items: string[]) =>
  items.reduce((prefix, item) => {
    let i = 0;
    while (i < prefix.length && prefix[i] === item[i]) i += 1;
    return prefix.slice(0, i);
  });

// Tab 自動補完：跟 bash 一樣，唯一符合就補完；多個符合先補到共同的部分，候選清單交給呼叫端決定要不要列
export const complete = (input: string): { value: string; candidates: string[] } => {
  const parts = input.split(' ');
  const last = parts[parts.length - 1];
  const eventFiles = eventEntries.map(([id]) => `events/${id}`);
  const pools: Record<string, string[]> = {
    cd: Object.keys(pages).filter(p => /^[a-z]+$/.test(p)),
    // 跟真的 shell 一樣：只補目前這一層，打到 events/ 才補資料夾裡的檔案
    cat: last.startsWith('events/') ? eventFiles : [...publicFiles, 'events/', ...(last.startsWith('.') ? hiddenFiles : [])],
    ls: ['events/'],
    finger: memberNames,
    help: docNames,
    man: docNames,
  };
  const pool = parts.length === 1 ? completions : pools[parts[0]] ?? [];
  const matches = pool.filter(p => p.startsWith(last) && p !== last).sort((a, b) => a.localeCompare(b));
  if (matches.length === 0) return { value: input, candidates: [] };
  if (matches.length === 1) {
    // 指令名稱補完後加空格，方便接著打參數
    const value = [...parts.slice(0, -1), matches[0]].join(' ') + (parts.length === 1 ? ' ' : '');
    return { value, candidates: [] };
  }
  return { value: [...parts.slice(0, -1), commonPrefix(matches)].join(' '), candidates: matches };
};

// 連按兩下 Tab 時，候選清單照 bash 的樣子直向分欄排；資料夾裡的檔案只顯示檔名
export const formatCandidates = (paths: string[]) => {
  const items = paths.map(p => (p.endsWith('/') ? p : p.slice(p.lastIndexOf('/') + 1)));
  const width = Math.max(...items.map(displayWidth)) + 2;
  const cols = Math.max(1, Math.floor(80 / width));
  const rows = Math.ceil(items.length / cols);
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => items[r + c * rows])
      .filter((item): item is string => item !== undefined)
      .map(item => item + ' '.repeat(width - displayWidth(item)))
      .join('')
      .trimEnd(),
  ).join('\n');
};
