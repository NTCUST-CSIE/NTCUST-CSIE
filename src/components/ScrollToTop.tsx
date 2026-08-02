import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        // Immediately jump to the element without weird smooth scrolling from previous page's position
        element.scrollIntoView({ behavior: 'auto' });
      } else {
        // Fallback if component renders asynchronously
        const timer = setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'auto' });
          }
        }, 10);
        return () => clearTimeout(timer);
      }
    } else {
      // If no hash, immediately reset scroll to top of page
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
