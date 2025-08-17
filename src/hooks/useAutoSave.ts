import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AutoSaveStatus {
  saving: boolean;
  saved: boolean;
  error: string | null;
}

export interface UseAutoSaveOptions {
  delay?: number; // Debounce delay in milliseconds (default: 1500)
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
}

/**
 * Hook för automatisk sparning med debouncing och visuell feedback
 */
export function useAutoSave<T extends Record<string, any>>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
) {
  const { delay = 1500, onSaveStart, onSaveSuccess, onSaveError } = options;
  const { toast } = useToast();
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  const hasChangesRef = useRef(false);
  const lastSavedDataRef = useRef<string>('');
  
  // State för att hålla koll på sparstatus
  const [status, setStatus] = useState<AutoSaveStatus>({
    saving: false,
    saved: false,
    error: null
  });

  const executeSave = useCallback(async () => {
    const currentDataStr = JSON.stringify(data);
    
    // Skippa om ingen förändring sedan senaste sparning
    if (currentDataStr === lastSavedDataRef.current) {
      hasChangesRef.current = false;
      return;
    }
    
    setStatus({ saving: true, saved: false, error: null });
    onSaveStart?.();
    
    try {
      await saveFunction(data);
      
      if (isMountedRef.current) {
        lastSavedDataRef.current = currentDataStr;
        setStatus({ saving: false, saved: true, error: null });
        hasChangesRef.current = false;
        onSaveSuccess?.();
        
        // Visa "Sparat ✓" i 2 sekunder
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus(prev => prev.saved ? { saving: false, saved: false, error: null } : prev);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kunde inte spara automatiskt';
      
      if (isMountedRef.current) {
        setStatus({ saving: false, saved: false, error: errorMessage });
        onSaveError?.(errorMessage);
        
        toast({
          title: "Sparfel",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  }, [data, saveFunction, onSaveStart, onSaveSuccess, onSaveError, toast]);

  // Funktion för att trigga sparning med debouncing
  const triggerSave = useCallback(() => {
    const currentDataStr = JSON.stringify(data);
    
    // Bara sätt hasChanges om datan faktiskt har ändrats
    if (currentDataStr !== lastSavedDataRef.current) {
      hasChangesRef.current = true;
      
      // Rensa tidigare timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Sätt nytt timeout
      timeoutRef.current = setTimeout(() => {
        executeSave();
      }, delay);
    }
  }, [data, executeSave, delay]);

  // Funktion för att tvinga fram omedelbar sparning (vid navigering)
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (hasChangesRef.current) {
      await executeSave();
    }
  }, [executeSave]);

  // Spara vid komponenten unmounts (navigering bort)
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (hasChangesRef.current && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        // Kör synkron sparning vid unmount
        executeSave();
      }
    };
  }, [executeSave]);
  
  // Auto-trigger save when data changes
  useEffect(() => {
    triggerSave();
  }, [triggerSave]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    triggerSave,
    forceSave,
    status,
    hasUnsavedChanges: hasChangesRef.current
  };
}