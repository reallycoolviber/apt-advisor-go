import { useEffect, useRef } from 'react';
import { useEvaluationStore } from '@/stores/evaluationStore';

interface UseEvaluationAutoSaveOptions {
  delay?: number; // Debounce delay in milliseconds (default: 1500)
  enabled?: boolean; // Whether auto-save is enabled (default: true)
}

/**
 * Hook that sets up auto-save for the current evaluation in the store
 * Debounces changes and saves when user stops typing
 * Also saves immediately when component unmounts (navigation)
 */
export function useEvaluationAutoSave(options: UseEvaluationAutoSaveOptions = {}) {
  const { delay = 1500, enabled = true } = options;
  
  const { 
    hasUnsavedChanges, 
    currentEvaluation, 
    currentEvaluationId,
    saveCurrentEvaluation 
  } = useEvaluationStore();
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  
  // Set up auto-save on changes
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges || !currentEvaluation) {
      return;
    }
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && hasUnsavedChanges) {
        console.log('Auto-saving evaluation...');
        saveCurrentEvaluation();
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, currentEvaluation, enabled, delay, saveCurrentEvaluation]);
  
  // Force save on unmount (navigation away)
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Force immediate save if there are unsaved changes
      if (hasUnsavedChanges && currentEvaluation) {
        console.log('Force-saving on unmount...');
        saveCurrentEvaluation();
      }
    };
  }, [hasUnsavedChanges, currentEvaluation, saveCurrentEvaluation]);
  
  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Manual save function
  const forceSave = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (hasUnsavedChanges && currentEvaluation) {
      await saveCurrentEvaluation();
    }
  };
  
  return {
    forceSave
  };
}