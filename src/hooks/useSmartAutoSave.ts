import { useCallback, useEffect, useRef } from 'react';

interface UseSmartAutoSaveOptions {
  onSave: (value: any) => void;
  delay?: number;
  immediate?: boolean; // För checkboxes, dropdowns etc
}

/**
 * Smart auto-save hook som hanterar olika typer av inputs
 * - Text/textarea: Debounced save (1.5s delay)
 * - Checkboxes/selects: Immediate save
 */
export function useSmartAutoSave<T>({ onSave, delay = 1500, immediate = false }: UseSmartAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastValueRef = useRef<T>();

  const triggerSave = useCallback((value: T) => {
    // Skippa om värdet inte har ändrats
    if (JSON.stringify(value) === JSON.stringify(lastValueRef.current)) {
      return;
    }
    
    lastValueRef.current = value;

    if (immediate) {
      // Omedelbar sparning för checkboxes, dropdowns etc
      onSave(value);
    } else {
      // Debounced sparning för textfält
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        onSave(value);
      }, delay);
    }
  }, [onSave, delay, immediate]);

  // Cleanup på unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return triggerSave;
}