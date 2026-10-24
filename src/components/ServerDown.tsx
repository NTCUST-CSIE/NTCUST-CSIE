import { useEffect, useState } from 'react';

const panicLog = [
  '[  13.370000] Kernel panic - not syncing: Attempted to kill init! exitcode=0x00000100',
  '[  13.370001] CPU: 0 PID: 1 Comm: rm Not tainted 8.0.0-csie #1',
  '[  13.370002] ---[ end Kernel panic - not syncing: Attempted to kill init! ]---',
].join('\n');

// rm -rf / 之後的假當機畫面，只存在記憶體裡，重新整理就會恢復
const ServerDown = () => {
  const [phase, setPhase] = useState<'panic' | 'offline'>('panic');

  useEffect(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    document.body.style.overflow = 'hidden';
    document.title = window.location.hostname;
    const timer = setTimeout(() => setPhase('offline'), 1800);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  if (phase === 'panic') {
    return (
      <div className="server-down panic" role="alert">
        <pre>{panicLog}</pre>
      </div>
    );
  }

  return (
    <div className="server-down offline" role="alert">
      <div className="server-down-box">
        <div className="server-down-icon" aria-hidden="true">😵</div>
        <h1>無法連上這個網站</h1>
        <p><strong>{window.location.hostname}</strong> 的伺服器已經不存在了。</p>
        <p>你可以試試：</p>
        <ul>
          <li>檢查是不是有人執行了 <code>rm -rf /</code></li>
          <li>重新整理這個頁面（F5）</li>
        </ul>
        <p className="server-down-code">ERR_SERVER_DELETED</p>
        <button onClick={() => window.location.reload()}>重新載入</button>
      </div>
    </div>
  );
};

export default ServerDown;
