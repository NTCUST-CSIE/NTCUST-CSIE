import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, X, Moon, Sun } from '@phosphor-icons/react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
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
    // Close menu on route change
    setIsOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
          <li><Link to="/">首頁</Link></li>
          <li><Link to="/members">科會成員</Link></li>
          <li><Link to="/events">近期活動</Link></li>
          <li><Link to="/finance">財務報表</Link></li>
          <li><Link to="/feedback">意見箱</Link></li>
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
