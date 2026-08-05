import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      
      // 1. 先瞬間回到最頂端 (scrollY = 0)
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      // 2. 再從最頂端平滑滾動到目標部門
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // 若沒有錨點，直接回到頂端
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  // Track page views on route change
  useEffect(() => {
    const knownPages = ['/', '/members', '/events', '/finance', '/feedback', '/aichat'];
    if (knownPages.includes(pathname.toLowerCase())) {
      trackEvent({ type: 'pageview', path: pathname });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;

