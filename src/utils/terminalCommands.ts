import membersData from '../data/members.json';
import eventsData from '../data/events.json';
import financeData from '../data/finance.json';
import { discoverEgg, eggs, getFoundEggs, requestTheme } from './eggs';

export type LineKind = 'input' | 'output' | 'error' | 'accent' | 'train';
export type TerminalMode = 'shell' | 'password' | 'vim';

export interface TerminalApi {
  print: (text: string, kind?: LineKind) => void;
  printSequence: (lines: string[], interval: number, onDone?: () => void) => void;
  clear: () => void;
  close: () => void;
  navigate: (path: string) => void;
  setMode: (mode: TerminalMode) => void;
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
  members: { name: string; title: string }[];
}

interface Semester {
  total: { income: number | null; expense: number | null; balance: number | null };
}

// CTF 第 3 關的 dev-notes.txt 裡寫著這個密碼
const SUDO_PASSWORD = 'hunter2';

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

const visibleCommands: [string, string][] = [
  ['help', '顯示這份說明'],
  ['ls [-a] [-l]', '列出檔案'],
  ['cat <檔案>', '讀取檔案'],
  ['cd <頁面>', '前往頁面：members / events / finance / feedback / flag / ~'],
  ['pwd / whoami / date', '基本資訊'],
  ['history / clear', '指令紀錄 / 清除畫面'],
  ['neofetch', '系統資訊'],
  ['fortune', '來點工程師語錄'],
  ['cowsay <文字>', '讓牛幫你說話'],
  ['theme [dark|light]', '切換主題'],
  ['eggs', '彩蛋收集進度'],
  ['ctf', 'CSIE CTF 說明'],
  ['exit', '離開終端機'],
];

const completions = ['help', 'ls', 'cat', 'cd', 'pwd', 'whoami', 'date', 'history', 'clear', 'neofetch',
  'fortune', 'cowsay', 'theme', 'eggs', 'ctf', 'exit', 'echo', 'uptime', 'uname'];

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
      return (membersData as Department[])
        .map(d => `${d.departmentTitle}：${d.members.map(m => `${m.name}（${m.title}）`).join('、')}`)
        .join('\n');
    case 'events.json':
      return Object.values(eventsData).map(e => `• ${e.title}`).join('\n') + '\n\n試試 cd events';
    case 'finance.json':
      return Object.entries(financeData as Record<string, Semester>)
        .map(([key, s]) => `${key} 學期｜收入 ${formatAmount(s.total.income)}｜支出 ${formatAmount(s.total.expense)}｜結餘 ${formatAmount(s.total.balance)}`)
        .join('\n') + '\n\n試試 cd finance 比較快 :）';
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
  const departments = membersData as Department[];
  const memberCount = departments.reduce((n, d) => n + d.members.length, 0);
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const info = [
    'guest@nutccsie.org',
    '------------------',
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

const isDangerousRm = (args: string[]) => {
  const flags = args.filter(a => a.startsWith('-')).join('');
  const targets = args.filter(a => !a.startsWith('-'));
  return flags.includes('r') && flags.includes('f') && targets.some(t => ['/', '/*', '~', '~/', '*', '.'].includes(t));
};

const showEggs = (api: TerminalApi) => {
  const found = getFoundEggs();
  const lines = eggs.map(e => (found.includes(e.id) ? `  ✅ ${e.name}` : `  ⬜ ???　提示：${e.hint}`));
  api.print(`🥚 彩蛋收集進度：${eggs.filter(e => found.includes(e.id)).length}/${eggs.length}\n${lines.join('\n')}`);
};

const runAsRoot = (command: string, api: TerminalApi, session: TerminalSession) => {
  const [cmd, ...args] = command.split(/\s+/);
  if (cmd === 'cat' && args[0] === '.flag') {
    api.print(`🚩 CSIE CTF 5/5：${atob('cGwzNHMzfQ==')}`, 'accent');
    api.print('把五片按照順序拼起來，到 /flag 提交吧！');
    return;
  }
  if (cmd === 'rm' && isDangerousRm(args)) {
    api.print('就算你是 root，我也不會讓你刪的 😤', 'error');
    discoverEgg('rmrf');
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
  if (session.mode === 'password') {
    if (raw === SUDO_PASSWORD) {
      session.sudoFails = 0;
      api.setMode('shell');
      runAsRoot(session.sudoCommand, api, session);
      return;
    }
    session.sudoFails += 1;
    if (session.sudoFails >= 3) {
      session.sudoFails = 0;
      api.setMode('shell');
      api.print('sudo: 3 incorrect password attempts', 'error');
      api.print('guest is not in the sudoers file. This incident will be reported. 🚨', 'error');
      discoverEgg('sudo');
      return;
    }
    api.print('Sorry, try again.', 'error');
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
      api.print(visibleCommands.map(([name, desc]) => `  ${name.padEnd(20)}${desc}`).join('\n'));
      api.print('（還有一些不能給你看的指令，自己找找看 👀）', 'accent');
      return;
    case 'ls':
    case 'dir': {
      const opts = args.filter(a => a.startsWith('-')).join('');
      api.print(listFiles(opts.includes('a'), opts.includes('l')));
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
        api.print('那個...我不會通靈（如果你要的是貓，輸入 meow）', 'error');
        return;
      }
      if (file === '.flag') {
        api.print('cat: .flag: Permission denied', 'error');
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
      api.print('guest');
      return;
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
      api.print(args.includes('-a') ? 'CSIE-OS nutccsie.org 8.0.0 #1 SMP React19 Vite x86_64 GNU/Linux' : 'CSIE-OS');
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
        '• 第一片在哪？試試看 開發人員工具（F12）',
      ].join('\n'), 'accent');
      return;
    case 'sudo':
      if (args.length === 0) {
        api.print('usage: sudo <command>', 'error');
        return;
      }
      session.sudoCommand = args.join(' ');
      api.print('[sudo] password for guest:');
      api.setMode('password');
      return;
    case 'su':
      api.print('su: Authentication failure（試試 sudo？）', 'error');
      return;
    case 'rm':
      if (isDangerousRm(args)) {
        api.printSequence([
          'removing /home/guest/members.json…',
          'removing /home/guest/finance.json…（財務長：？？？）',
          'removing /var/www/nutccsie.org…',
          'removing /usr/lib/node_modules…（這個要刪很久）',
          'removing /bin/bash…',
          '……',
          '開玩笑的啦，網站還在 😎（千萬別在自己的電腦上試）',
        ], 450, () => discoverEgg('rmrf'));
      } else if (args.length === 0) {
        api.print('rm: missing operand', 'error');
      } else {
        api.print(`rm: cannot remove '${args[args.length - 1]}': Read-only file system`, 'error');
      }
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
      api.print(teapot);
      discoverEgg('coffee');
      return;
    case 'make':
      if (args.join(' ') === 'coffee') {
        api.print(teapot);
        discoverEgg('coffee');
      } else if (args.join(' ') === 'me a sandwich') {
        api.print('What? Make it yourself.');
      } else {
        api.print('make: *** No targets specified and no makefile found. Stop.', 'error');
      }
      return;
    case 'brew':
      if (args[0] === 'coffee') {
        api.print(teapot);
        discoverEgg('coffee');
      } else {
        api.print('brew: 我不是 macOS 我是CSIE OS', 'error');
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
      api.print('What manual page do you want?（試試 help）');
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

// Tab 自動補完：指令名稱、檔名或頁面名稱
export const complete = (input: string) => {
  const parts = input.split(' ');
  if (parts.length === 1) {
    const matches = completions.filter(c => c.startsWith(parts[0]));
    return matches.length === 1 ? `${matches[0]} ` : input;
  }
  const last = parts[parts.length - 1];
  const pool = parts[0] === 'cd'
    ? Object.keys(pages).filter(p => /^[a-z]+$/.test(p))
    : parts[0] === 'cat'
      ? [...publicFiles, ...(last.startsWith('.') ? hiddenFiles : [])]
      : [];
  const matches = pool.filter(p => p.startsWith(last));
  if (matches.length !== 1) return input;
  return [...parts.slice(0, -1), matches[0]].join(' ');
};
