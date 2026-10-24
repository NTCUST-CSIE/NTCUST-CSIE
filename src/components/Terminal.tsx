import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
import { complete, handleInput } from '../utils/terminalCommands';
import type { LineKind, TerminalApi, TerminalMode, TerminalSession } from '../utils/terminalCommands';
import { discoverEgg } from '../utils/eggs';
import { createBtop, renderBtop, stepBtop } from '../utils/btop';
import type { BtopRow } from '../utils/btop';

interface Line {
  id: number;
  text: string;
  kind: LineKind;
}

interface TerminalProps {
  open: boolean;
  onClose: () => void;
}

const PROMPT = 'guest@csie:~$';
const MAX_LINES = 300;

const welcome = [
  'CSIE OS 8.0 tty1',
  '輸入 help 查看可用指令，按 Esc 或輸入 exit 離開。',
];

const Terminal = ({ open, onClose }: TerminalProps) => {
  const navigate = useNavigate();
  const nextId = useRef(welcome.length);
  const [lines, setLines] = useState<Line[]>(() => welcome.map((text, id) => ({ id, text, kind: 'accent' })));
  const [input, setInput] = useState('');
  const [btopScreen, setBtopScreen] = useState<BtopRow[]>([]);
  const [mode, setModeState] = useState<TerminalMode>('shell');
  const session = useRef<TerminalSession>({ mode: 'shell', history: [], sudoCommand: '', sudoFails: 0, vimTries: 0 });
  const historyCursor = useRef(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const print = (text: string, kind: LineKind = 'output') => {
    const id = nextId.current++;
    setLines(prev => [...prev, { id, text, kind }].slice(-MAX_LINES));
  };

  const setMode = (next: TerminalMode) => {
    session.current.mode = next;
    setModeState(next);
  };

  const api: TerminalApi = {
    print,
    printSequence: (seq, interval, onDone) => {
      seq.forEach((text, i) => timers.current.push(setTimeout(() => print(text), interval * (i + 1))));
      if (onDone) timers.current.push(setTimeout(onDone, interval * seq.length));
    },
    printTimeline: (steps, onDone, pause = 0) => {
      let elapsed = 0;
      steps.forEach(step => {
        elapsed += step.delay;
        timers.current.push(setTimeout(() => print(step.text, step.kind), elapsed));
      });
      if (onDone) timers.current.push(setTimeout(onDone, elapsed + pause));
    },
    clear: () => setLines([]),
    close: onClose,
    navigate: path => navigate(path),
    setMode,
  };

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!open) {
      // 關掉終端機就像關掉視窗：輸到一半的 sudo 密碼、vim、btop 都一起結束
      if (session.current.mode !== 'shell') setMode('shell');
      session.current.sudoFails = 0;
      setInput('');
      return;
    }
    discoverEgg('terminal');
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [lines, open]);

  const submit = () => {
    const raw = input;
    setInput('');
    historyCursor.current = -1;
    // 輸入密碼時不回顯，跟真的 sudo 一樣
    if (mode === 'shell') print(`${PROMPT} ${raw}`, 'input');
    else if (mode === 'vim') print(raw, 'input');
    handleInput(raw, api, session.current);
  };

  // btop 全螢幕：q / Esc / Ctrl+C 離開，回到剛才的輸出
  useEffect(() => {
    if (mode !== 'btop') return;
    const state = createBtop();
    const draw = () => setBtopScreen(renderBtop(state, new Date()));
    draw();
    const timer = setInterval(() => {
      stepBtop(state);
      draw();
    }, 1000);
    return () => clearInterval(timer);
  }, [mode]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (mode === 'btop') {
      e.preventDefault();
      const quit = e.key === 'q' || e.key === 'Q' || e.key === 'Escape' || (e.ctrlKey && e.key === 'c');
      if (quit) setMode('shell');
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (mode === 'vim') print('（你這樣出不去的，查看看怎麼退出vim吧...這不難）', 'error');
      else onClose();
      return;
    }
    if (e.ctrlKey && e.key === 'c' && e.currentTarget.selectionStart === e.currentTarget.selectionEnd) {
      e.preventDefault();
      if (mode === 'vim') {
        print('Type  :qa!  and press <Enter> to abandon all changes and exit Vim', 'error');
        return;
      }
      print(mode === 'shell' ? `${PROMPT} ${input}^C` : '^C', 'input');
      setInput('');
      if (mode === 'password') {
        session.current.sudoFails = 0;
        setMode('shell');
      }
      return;
    }
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      api.clear();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (mode === 'shell') setInput(complete(input));
      return;
    }
    if (mode !== 'shell') return;

    const history = session.current.history;
    if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault();
      historyCursor.current = historyCursor.current < 0 ? history.length - 1 : Math.max(0, historyCursor.current - 1);
      setInput(history[historyCursor.current]);
    } else if (e.key === 'ArrowDown' && historyCursor.current >= 0) {
      e.preventDefault();
      historyCursor.current += 1;
      if (historyCursor.current >= history.length) {
        historyCursor.current = -1;
        setInput('');
      } else {
        setInput(history[historyCursor.current]);
      }
    }
  };

  // 點終端機任何地方都能繼續打字，但選取文字複製時不要搶走焦點
  const focusInput = () => {
    if (window.getSelection()?.isCollapsed ?? true) inputRef.current?.focus();
  };

  if (!open) return null;

  return (
    <div className="terminal-overlay" onClick={onClose}>
      <div className={`terminal-window${mode === 'btop' ? ' is-btop' : ''}`} role="dialog" aria-label="CSIE 終端機" onClick={e => { e.stopPropagation(); focusInput(); }}>
        <div className="terminal-titlebar">
          <span className="terminal-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span className="terminal-title">guest@csie: ~</span>
          <button className="terminal-close" aria-label="關閉終端機" onClick={onClose}>
            <X weight="bold" />
          </button>
        </div>
        <div className={`terminal-body${mode === 'btop' ? ' is-btop' : ''}`} ref={bodyRef}>
          {mode === 'btop' ? (
            <div className="terminal-btop">
              {btopScreen.map((row, y) => (
                <div key={y} className="terminal-btop-row">
                  {row.map((run, x) => {
                    const style = run.color ? { color: run.color } : undefined;
                    // 方塊、框線、箭頭在不同字型裡寬度不一，逐字包成 1ch 寬，欄位才不會錯位
                    return run.text.split(/([^\x00-\x7f])/).filter(Boolean).map((part, i) =>
                      /^[^\x00-\x7f]$/.test(part)
                        ? <span key={`${x}-${i}`} className="btop-cell" style={style}>{part}</span>
                        : <span key={`${x}-${i}`} style={style}>{part}</span>,
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            lines.map(line => (
              <pre key={line.id} className={`terminal-line ${line.kind}`}>
                {line.kind === 'train' ? <span>{line.text}</span> : line.text}
              </pre>
            ))
          )}
          <div className="terminal-input-row">
            {mode === 'shell' && <span className="terminal-prompt">{PROMPT}</span>}
            <input
              ref={inputRef}
              type={mode === 'password' ? 'password' : 'text'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label={mode === 'password' ? '輸入 sudo 密碼' : '輸入指令'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
