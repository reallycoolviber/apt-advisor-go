import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable error state component with retry functionality
 */
export function ErrorState({ 
  title = "Något gick fel", 
  message = "Kunde inte hämta data. Vänligen försök igen senare.",
  onRetry,
  className,
  size = 'md'
}: ErrorStateProps) {
  const sizeClasses = {
    sm: "p-4",
    md: "p-8", 
    lg: "p-12"
  };

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center bg-card rounded-lg border border-border",
      sizeClasses[size],
      className
    )}>
      <AlertCircle className={cn("text-destructive mb-4", iconSizes[size])} />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Försök igen
        </Button>
      )}
    </div>
  );
}

/**
 * Inline error state for smaller spaces
 */
export function InlineErrorState({ 
  message = "Kunde inte ladda data", 
  onRetry,
  className 
}: Omit<ErrorStateProps, 'title' | 'size'>) {
  return (
    <div className={cn(
      "flex items-center justify-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg",
      className
    )}>
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      <span className="text-sm text-foreground flex-1">{message}</span>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="ghost" 
          size="sm"
          className="h-8 px-3 text-sm"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Försök igen
        </Button>
      )}
    </div>
  );
}