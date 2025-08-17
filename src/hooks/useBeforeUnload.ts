import { useEffect } from 'react';

interface UseBeforeUnloadOptions {
  hasUnsavedChanges: boolean;
  message?: string;
}

/**
 * Hook för att varna användaren om de försöker lämna sidan med osparade ändringar
 */
export function useBeforeUnload({ hasUnsavedChanges, message }: UseBeforeUnloadOptions) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const confirmationMessage = message || 'Du har osparade ändringar. Är du säker på att du vill lämna sidan?';
        e.preventDefault();
        e.returnValue = confirmationMessage;
        return confirmationMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
}