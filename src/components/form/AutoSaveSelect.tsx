import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSmartAutoSave } from '@/hooks/useSmartAutoSave';

interface AutoSaveSelectProps {
  value?: string;
  onAutoSave: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  onValueChange?: (value: string) => void;
}

/**
 * Select-komponent med inbyggd auto-save funktionalitet
 * Sparar omedelbart vid val (ingen debounce)
 */
export function AutoSaveSelect({ 
  value, 
  onAutoSave, 
  placeholder, 
  options,
  onValueChange,
  ...props 
}: AutoSaveSelectProps) {
  const triggerAutoSave = useSmartAutoSave({
    onSave: onAutoSave,
    immediate: true // Omedelbar sparning för selects
  });

  const handleValueChange = (newValue: string) => {
    // Anropa original onValueChange om den finns
    onValueChange?.(newValue);
    
    // Trigga auto-save
    triggerAutoSave(newValue);
  };

  return (
    <Select value={value} onValueChange={handleValueChange} {...props}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}