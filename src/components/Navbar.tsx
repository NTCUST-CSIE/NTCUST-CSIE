import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, X, Moon, Sun } from '@phosphor-icons/react';
import { startDisco, THEME_EVENT } from '../utils/eggs';
import { getActiveSeason } from '../utils/seasonal';

const navItems = [
  { to: '/', label: '首頁' },
  { to: '/members', label: '科會成員' },
  { to: '/events', label: '近期活動' },
  { to: '/finance', label: '財務報表' },
  { to: '/feedback', label: '意見箱' },
  { to: 'https://line.me/ti/g2/ISzaO-wc9BvFLmqHydqeoL_wRf7sPNUro3MY4A?utm_source=invitation&utm_medium=link_copy&utm_campaign=default', label: '新生社群' },
];

const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  // 愚人節限定：導覽列順序打亂
  const [items] = useState(() => (getActiveSeason()?.id === 'aprilfools' ? shuffle(navItems) : navItems));
  const themeClicks = useRef<number[]>([]);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // 終端機的 theme 指令
    const handleThemeRequest = (e: Event) => setTheme((e as CustomEvent<string>).detail);
    window.addEventListener(THEME_EVENT, handleThemeRequest);
    return () => window.removeEventListener(THEME_EVENT, handleThemeRequest);
  }, []);

  useEffect(() => {
    // Close menu on route change
    setIsOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

    // 彩蛋：3 秒內切換 10 次
    const now = Date.now();
    themeClicks.current = [...themeClicks.current.filter(t => now - t < 3000), now];
    if (themeClicks.current.length >= 10) {
      themeClicks.current = [];
      startDisco();
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="logo">
          <span className="logo-text">NTCUST <span className="highlight">CSIE</span></span>
          <img src="/img/logo.png" alt="NTCUST CSIE Logo" className="nav-logo" width="141" height="70" />
          <span className="logo-subtext">國立臺中科技大學 資訊工程科 科學會</span>
        </Link>
        <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X weight="bold" /> : <List weight="bold" />}
        </div>
        <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
          {items.map(item => (
            <li key={item.to}><Link to={item.to}>{item.label}</Link></li>
          ))}
          <li>
            <button className="theme-toggle" aria-label="切換深色/淺色模式" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun weight="fill" /> : <Moon weight="fill" />}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
