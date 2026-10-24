import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Terminal from './Terminal';
import SeasonalDecor from './SeasonalDecor';
import { discoverEgg, TERMINAL_EVENT, TOAST_EVENT } from '../utils/eggs';

const AWAY_TITLE = '別走啊 QQ 🥺';
const BACK_TITLE = '歡迎回來！🎉';

interface Toast {
  id: number;
  message: string;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// 全站彩蛋：` 鍵開終端機、分頁標題、通知訊息與節日裝飾
const EasterEggs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const handleToast = (e: Event) => {
      const id = nextToastId.current++;
      const message = (e as CustomEvent<string>).detail;
      setToasts(prev => [...prev.slice(-2), { id, message }]);
      timers.push(setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500));
    };
    window.addEventListener(TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      timers.forEach(clearTimeout);
    };
  }, []);

  // 切走分頁時改標題，切回來再改回去
  useEffect(() => {
    let originalTitle = document.title;
    let restoreTimer: ReturnType<typeof setTimeout> | undefined;
    const handleVisibility = () => {
      clearTimeout(restoreTimer);
      if (document.hidden) {
        if (document.title !== BACK_TITLE) originalTitle = document.title;
        document.title = AWAY_TITLE;
      } else {
        document.title = BACK_TITLE;
        restoreTimer = setTimeout(() => { document.title = originalTitle; }, 2000);
        discoverEgg('tab');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(restoreTimer);
      document.title = originalTitle;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;

      if (e.code === 'Backquote' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setTerminalOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleTerminal = () => setTerminalOpen(true);
    window.addEventListener(TERMINAL_EVENT, handleTerminal);
    return () => window.removeEventListener(TERMINAL_EVENT, handleTerminal);
  }, []);

  // 手機沒有 ` 鍵，可以直接打開 /terminal
  useEffect(() => {
    if (pathname === '/terminal') setTerminalOpen(true);
  }, [pathname]);

  const closeTerminal = () => {
    setTerminalOpen(false);
    if (pathname === '/terminal') navigate('/', { replace: true });
  };

  return (
    <>
      <SeasonalDecor />
      <Terminal open={terminalOpen} onClose={closeTerminal} />
      <div className="egg-toasts" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="egg-toast">{t.message}</div>
        ))}
      </div>
    </>
  );
};

export default EasterEggs;
