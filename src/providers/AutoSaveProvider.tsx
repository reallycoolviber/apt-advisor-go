import React, { createContext, useContext, useEffect } from 'react';
import { useEvaluationStore } from '@/stores/evaluationStore';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { AutoSaveStatusIndicator } from '@/components/ui/auto-save-status';

interface AutoSaveContextType {
  hasUnsavedChanges: boolean;
  autoSaveStatus: {
    saving: boolean;
    saved: boolean;
    error: string | null;
  };
}

const AutoSaveContext = createContext<AutoSaveContextType>({
  hasUnsavedChanges: false,
  autoSaveStatus: {
    saving: false,
    saved: false,
    error: null
  }
});

export const useAutoSaveContext = () => useContext(AutoSaveContext);

interface AutoSaveProviderProps {
  children: React.ReactNode;
}

/**
 * Global provider för auto-save funktionalitet
 * Hanterar beforeunload-varningar och tillhandahåller global status
 */
export function AutoSaveProvider({ children }: AutoSaveProviderProps) {
  const { hasUnsavedChanges, autoSaveStatus } = useEvaluationStore();

  // Säkerhetsnät vid navigering
  useBeforeUnload({
    hasUnsavedChanges,
    message: 'Du har osparade ändringar. Är du säker på att du vill lämna sidan?'
  });

  const contextValue: AutoSaveContextType = {
    hasUnsavedChanges,
    autoSaveStatus
  };

  return (
    <AutoSaveContext.Provider value={contextValue}>
      {children}
      {/* Global auto-save status indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <AutoSaveStatusIndicator 
          status={autoSaveStatus}
          className="bg-card border border-border rounded-md px-3 py-2 shadow-lg"
        />
      </div>
    </AutoSaveContext.Provider>
  );
}