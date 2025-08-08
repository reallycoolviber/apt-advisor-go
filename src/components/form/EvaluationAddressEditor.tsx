import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, MapPin } from 'lucide-react';
import { useEvaluationStore } from '@/stores/evaluationStore';

interface EvaluationAddressEditorProps {
  className?: string;
}

const EvaluationAddressEditor: React.FC<EvaluationAddressEditorProps> = ({ className }) => {
  // Only UI state for editing mode, NOT evaluation data
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState('');

  // Read directly from central store
  const { currentEvaluation, updateField } = useEvaluationStore();
  const address = currentEvaluation?.address || '';

  const handleStartEdit = () => {
    setTempValue(address);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (tempValue.trim()) {
      // Update central store directly
      updateField('address', '', tempValue.trim());
    }
    setIsEditing(false);
    setTempValue('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!address) return null;

  return (
    <div className={`max-w-md mx-auto mb-6 ${className || ''}`}>
      <div className="flex items-center gap-3 p-4 bg-primary rounded-lg border-2 border-primary shadow-lg">
        <MapPin className="h-5 w-5 text-primary-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder="Ange adress"
                className="text-sm"
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="h-6 px-2 text-xs"
                >
                  Spara
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-6 px-2 text-xs"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-primary-foreground">{address}</p>
              <p className="text-xs text-primary-foreground/80">Adress för utvärdering</p>
            </>
          )}
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEdit}
            className="p-2 hover:bg-primary-foreground/20 text-primary-foreground flex-shrink-0"
            title="Redigera adress"
          >
            <Edit className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default EvaluationAddressEditor;