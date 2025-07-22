import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

interface ValidatedInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validation?: ValidationResult;
  placeholder?: string;
  className?: string;
  type?: string;
}

export const ValidatedInput = ({ 
  id, 
  label, 
  value, 
  onChange, 
  validation, 
  placeholder, 
  className,
  type = "text"
}: ValidatedInputProps) => {
  const hasValidation = validation !== undefined;
  const isInvalid = hasValidation && !validation.isValid;
  const isValid = hasValidation && validation.isValid && value.trim() !== '';

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "bg-background",
            isInvalid && "border-destructive bg-destructive/5 focus-visible:ring-destructive",
            isValid && "border-green-500 bg-green-50/50 dark:bg-green-950/20",
            className
          )}
        />
        {isInvalid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
        )}
        {isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      {isInvalid && validation.reason && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {validation.reason}
        </p>
      )}
    </div>
  );
};