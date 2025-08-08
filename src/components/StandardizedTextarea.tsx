import * as React from "react"
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StandardizedTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
  success?: boolean;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
}

export const StandardizedTextarea = React.forwardRef<
  HTMLTextAreaElement,
  StandardizedTextareaProps
>(({ 
  id, 
  label, 
  value, 
  onChange, 
  onBlur,
  placeholder, 
  rows = 3,
  error,
  success,
  className,
  disabled,
  required,
  description,
  ...props 
}, ref) => {
  return (
    <div className="space-y-2">
      <Label 
        htmlFor={id} 
        className={cn(
          "text-sm font-medium text-foreground",
          required && "after:content-['*'] after:ml-0.5 after:text-destructive",
          disabled && "opacity-50"
        )}
      >
        {label}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <Textarea
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
          "resize-none",
          error && "border-destructive bg-destructive/5 focus:ring-destructive",
          success && "border-success bg-success/5 focus:ring-success",
          !error && !success && "border-input focus:border-ring",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
});

StandardizedTextarea.displayName = "StandardizedTextarea";