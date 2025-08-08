import React from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutoSaveStatus } from '@/hooks/useAutoSave';

interface AutoSaveStatusProps {
  status: AutoSaveStatus;
  className?: string;
}

/**
 * Visuell komponent för att visa autospar-status
 */
export function AutoSaveStatusIndicator({ status, className }: AutoSaveStatusProps) {
  if (!status.saving && !status.saved && !status.error) {
    return null; // Visa ingenting när inget händer
  }

  return (
    <div className={cn(
      "flex items-center gap-2 text-xs text-muted-foreground transition-all duration-200",
      className
    )}>
      {status.saving && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-app-primary" />
          <span className="text-app-primary">Sparar...</span>
        </>
      )}
      
      {status.saved && (
        <>
          <CheckCircle className="h-3 w-3 text-semantic-good" />
          <span className="text-semantic-good">Sparat ✓</span>
        </>
      )}
      
      {status.error && (
        <>
          <AlertCircle className="h-3 w-3 text-semantic-bad" />
          <span className="text-semantic-bad">Sparfel: {status.error}</span>
        </>
      )}
    </div>
  );
}