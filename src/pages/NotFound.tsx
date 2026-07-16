import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import linksData from '../data/404.json';

const NotFound = () => {
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const rawPath = location.pathname.replace(/^\/+|\/+$/g, "");
    const path = decodeURIComponent(rawPath).toLowerCase();

    const links = linksData as Record<string, string>;

    if (links[path]) {
      let target = links[path];
      if (target.startsWith('./')) {
        target = target.replace('./', '/').replace('.html', '');
      }
      window.location.replace(target);
    } else {
      setIsRedirecting(false);
    }
  }, [location]);

  if (isRedirecting) {
    return (
      <main id="status" aria-live="polite" style={styles.main}>
        <div className="loader" aria-label="正在導向" style={styles.loader}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main id="status" aria-live="polite" style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>404 找不到連結</h1>
        <p style={styles.message}>路徑 "{location.pathname}" 不存在。</p>
        <Link to="/" style={styles.link}>回到首頁</Link>
      </div>
    </main>
  );
};

const styles = {
  main: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: 'var(--bg, #1b212c)',
    color: 'var(--text, #ffffff)',
    fontFamily: '"Segoe UI", Arial, sans-serif'
  },
  loader: {
    width: '34px',
    height: '34px',
    border: '4px solid rgba(255, 255, 255, 0.18)',
    borderTopColor: 'var(--primary, #00a8f0)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  container: {
    textAlign: 'center' as const,
    display: 'grid',
    gap: '14px',
    justifyItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '28px'
  },
  message: {
    margin: 0,
    color: 'var(--muted, #9ca3af)',
    lineHeight: '1.7'
  },
  link: {
    color: 'var(--primary, #00a8f0)',
    fontWeight: 700,
    textDecoration: 'none'
  }
};

export default NotFound;
