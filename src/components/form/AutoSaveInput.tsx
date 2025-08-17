import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSmartAutoSave } from '@/hooks/useSmartAutoSave';

interface AutoSaveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onAutoSave: (value: string) => void;
  component?: 'input' | 'textarea';
  immediate?: boolean; // För särskilda fall där man vill ha omedelbar sparning
}

/**
 * Input-komponent med inbyggd auto-save funktionalitet
 * Använder debounced save för textfält (1.5s delay)
 */
export function AutoSaveInput({ 
  value, 
  onAutoSave, 
  component = 'input',
  immediate = false,
  onChange,
  ...props 
}: AutoSaveInputProps) {
  const triggerAutoSave = useSmartAutoSave({
    onSave: onAutoSave,
    delay: 1500,
    immediate
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Anropa original onChange om den finns
    onChange?.(e as any);
    
    // Trigga auto-save
    triggerAutoSave(newValue);
  };

  if (component === 'textarea') {
    return (
      <Textarea
        {...props as any}
        value={value}
        onChange={handleChange}
      />
    );
  }

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
}