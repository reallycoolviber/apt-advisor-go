import * as React from "react"
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StandardizedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  hover?: boolean;
  className?: string;
}

export const StandardizedCard = React.forwardRef<
  HTMLDivElement,
  StandardizedCardProps
>(({ children, variant = 'default', size = 'default', hover = false, className, ...props }, ref) => {
  const variantClasses = {
    default: 'bg-card border',
    secondary: 'bg-secondary border',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
    destructive: 'bg-destructive/5 border-destructive/20'
  };

  const sizeClasses = {
    sm: 'p-3',
    default: 'p-4', 
    lg: 'p-6'
  };

  return (
    <Card
      ref={ref}
      className={cn(
        "border transition-all duration-300 shadow-sm",
        variantClasses[variant],
        sizeClasses[size],
        hover && "hover:shadow-md hover:bg-hover hover:border-hover",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
});

StandardizedCard.displayName = "StandardizedCard";