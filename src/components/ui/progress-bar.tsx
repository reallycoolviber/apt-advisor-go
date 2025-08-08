import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  filled: number;
  total: number;
  className?: string;
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  filled,
  total,
  className,
  showText = true
}) => {
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
  
  return (
    <div className={cn("flex flex-col items-end gap-1 min-w-[60px]", className)}>
      {showText && (
        <div className="text-xs text-muted-foreground">
          {filled}/{total}
        </div>
      )}
      <div className="w-12 h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};