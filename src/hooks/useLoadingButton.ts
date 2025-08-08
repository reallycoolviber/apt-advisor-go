import { useState, useCallback } from 'react';

/**
 * Hook for managing button loading states and preventing double-clicks
 */
export function useLoadingButton() {
  const [isLoading, setIsLoading] = useState(false);

  const executeWithLoading = useCallback(async <T>(
    asyncFunction: () => Promise<T>
  ): Promise<T | null> => {
    if (isLoading) return null; // Prevent double-clicks
    
    setIsLoading(true);
    try {
      const result = await asyncFunction();
      return result;
    } catch (error) {
      throw error; // Re-throw so caller can handle
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return {
    isLoading,
    executeWithLoading
  };
}