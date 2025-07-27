import * as React from "react"
import { StandardizedCard } from './StandardizedCard';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StandardizedFieldGroupProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
}

export const StandardizedFieldGroup: React.FC<StandardizedFieldGroupProps> = ({
  title,
  description,
  icon: Icon,
  children,
  className,
  variant = 'default'
}) => {
  return (
    <StandardizedCard variant={variant} className={cn("space-y-4", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-base">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </StandardizedCard>
  );
};