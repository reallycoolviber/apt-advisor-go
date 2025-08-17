import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useSmartAutoSave } from '@/hooks/useSmartAutoSave';

interface AutoSaveCheckboxProps {
  checked?: boolean;
  onAutoSave: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  children?: React.ReactNode;
  id?: string;
  disabled?: boolean;
}

/**
 * Checkbox-komponent med inbyggd auto-save funktionalitet
 * Sparar omedelbart vid klick (ingen debounce)
 */
export function AutoSaveCheckbox({ 
  checked, 
  onAutoSave, 
  onCheckedChange,
  children,
  ...props 
}: AutoSaveCheckboxProps) {
  const triggerAutoSave = useSmartAutoSave({
    onSave: onAutoSave,
    immediate: true // Omedelbar sparning för checkboxes
  });

  const handleCheckedChange = (newChecked: boolean) => {
    // Anropa original onCheckedChange om den finns
    onCheckedChange?.(newChecked);
    
    // Trigga auto-save
    triggerAutoSave(newChecked);
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        {...props}
        checked={checked}
        onCheckedChange={handleCheckedChange}
      />
      {children && (
        <label 
          htmlFor={props.id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {children}
        </label>
      )}
    </div>
  );
}