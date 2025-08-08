import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that automatically scrolls to top when route changes
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo(0, 0);
  }, [pathname]);
}