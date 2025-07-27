import * as React from "react"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StandardizedInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  size?: 'sm' | 'default' | 'lg';
  error?: string;
  success?: boolean;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const StandardizedInput = React.forwardRef<
  HTMLInputElement,
  StandardizedInputProps
>(({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  size = "default",
  error,
  success,
  className,
  disabled,
  required,
  ...props 
}, ref) => {
  const inputSizeClasses = {
    sm: 'h-9 text-sm px-3',
    default: 'h-11 text-sm px-3.5',
    lg: 'h-13 text-base px-4'
  };

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
      <Input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border bg-background transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
          inputSizeClasses[size],
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

StandardizedInput.displayName = "StandardizedInput";