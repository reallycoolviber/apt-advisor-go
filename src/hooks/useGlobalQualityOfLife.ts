import { useEffect } from 'react';
import { useScrollToTop } from './useScrollToTop';

/**
 * Global hook that applies all Quality of Life improvements
 * - Scroll to top on route changes
 * - Auto-close toasts (handled in use-toast.ts)
 * - Loading states (handled by individual components)
 * - Error handling (handled by individual components)  
 * - Button loading states (handled by useLoadingButton)
 */
export function useGlobalQualityOfLife() {
  // 1. Scroll to top on route changes
  useScrollToTop();

  // 2. Toast auto-close is handled in use-toast.ts with TOAST_REMOVE_DELAY = 4000
  
  // 3. Loading states are handled by individual components using LoadingSkeleton
  
  // 4. Error handling is handled by ErrorState components
  
  // 5. Button loading states are handled by useLoadingButton hook
  
  // Additional global improvements can be added here
  useEffect(() => {
    // Prevent double-tap zoom on mobile for better UX
    document.addEventListener('touchstart', function(event) {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Clean up event listeners
    return () => {
      document.removeEventListener('touchstart', () => {});
      document.removeEventListener('touchend', () => {});
    };
  }, []);
}

export { useScrollToTop } from './useScrollToTop';
export { useLoadingButton } from './useLoadingButton';