import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UseChecklistAutoSaveOptions {
  delay?: number; // Debounce delay in milliseconds (default: 1500)
  userId: string;
}

/**
 * Hook for auto-saving checklist items with debouncing
 */
export function useChecklistAutoSave(options: UseChecklistAutoSaveOptions) {
  const { delay = 1500, userId } = options;
  const { toast } = useToast();
  
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const saveChecklistItem = useCallback(async (
    categoryIndex: number, 
    itemIndex: number, 
    itemText: string,
    isChecked: boolean, 
    comment: string,
    category: string
  ) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('checklist_items')
        .upsert({
          user_id: userId,
          item_category: category,
          item_index: itemIndex,
          item_text: itemText,
          is_checked: isChecked,
          comment: comment,
        }, {
          onConflict: 'user_id,item_category,item_index'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving checklist item:', error);
      toast({
        title: "Fel vid sparning",
        description: "Kunde inte spara checklistobjekt",
        variant: "destructive",
      });
    }
  }, [userId, toast]);

  const debouncedSave = useCallback((
    itemId: string,
    categoryIndex: number, 
    itemIndex: number, 
    itemText: string,
    isChecked: boolean, 
    comment: string,
    category: string
  ) => {
    // Clear existing timeout for this specific item
    const existingTimeout = timeoutRefs.current.get(itemId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout for this item
    const timeoutId = setTimeout(() => {
      saveChecklistItem(categoryIndex, itemIndex, itemText, isChecked, comment, category);
      timeoutRefs.current.delete(itemId);
    }, delay);

    timeoutRefs.current.set(itemId, timeoutId);
  }, [delay, saveChecklistItem]);

  const saveImmediately = useCallback(async (
    categoryIndex: number, 
    itemIndex: number, 
    itemText: string,
    isChecked: boolean, 
    comment: string,
    category: string,
    itemId?: string
  ) => {
    // Clear any pending timeout for this item
    if (itemId) {
      const existingTimeout = timeoutRefs.current.get(itemId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        timeoutRefs.current.delete(itemId);
      }
    }

    await saveChecklistItem(categoryIndex, itemIndex, itemText, isChecked, comment, category);
  }, [saveChecklistItem]);

  // Cleanup function to clear all timeouts
  const cleanup = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  return {
    debouncedSave,
    saveImmediately,
    cleanup
  };
}