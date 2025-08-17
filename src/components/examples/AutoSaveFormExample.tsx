import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AutoSaveInput } from '@/components/form/AutoSaveInput';
import { AutoSaveSelect } from '@/components/form/AutoSaveSelect';
import { AutoSaveCheckbox } from '@/components/form/AutoSaveCheckbox';
import { useAutoSaveContext } from '@/providers/AutoSaveProvider';
import { useEvaluationStore } from '@/stores/evaluationStore';

/**
 * Exempel på hur man använder auto-save komponenterna
 * Detta visar bästa praxis för integration
 */
export function AutoSaveFormExample() {
  const { updateField, currentEvaluation } = useEvaluationStore();
  const { hasUnsavedChanges, autoSaveStatus } = useAutoSaveContext();

  if (!currentEvaluation) {
    return <div>Ingen evaluation laddad</div>;
  }

  const handleAddressChange = (value: string) => {
    updateField('address', '', value); // Special case för address
  };

  const handleSizeChange = (value: string) => {
    updateField('general', 'size', value);
  };

  const handleRoomsChange = (value: string) => {
    updateField('general', 'rooms', value);
  };

  const handleMaintenanceChange = (value: boolean) => {
    updateField('financial', 'majorMaintenanceDone', value);
  };

  const roomOptions = [
    { value: '1', label: '1 rum' },
    { value: '1.5', label: '1.5 rum' },
    { value: '2', label: '2 rum' },
    { value: '2.5', label: '2.5 rum' },
    { value: '3', label: '3 rum' },
    { value: '3.5', label: '3.5 rum' },
    { value: '4', label: '4 rum' },
    { value: '4.5', label: '4.5 rum' },
    { value: '5+', label: '5+ rum' }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Auto-Save Formulär Exempel</CardTitle>
        <div className="text-sm text-muted-foreground">
          Status: {autoSaveStatus.saving ? 'Sparar...' : autoSaveStatus.saved ? 'Sparat ✓' : 'Klar'}
          {hasUnsavedChanges && ' • Har osparade ändringar'}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Textfält med debounced auto-save (1.5s) */}
        <div className="space-y-2">
          <Label htmlFor="address">Adress (Auto-save efter 1.5s)</Label>
          <AutoSaveInput
            id="address"
            value={currentEvaluation.address}
            onAutoSave={handleAddressChange}
            placeholder="Ange adress..."
          />
        </div>

        {/* Storlek - också debounced */}
        <div className="space-y-2">
          <Label htmlFor="size">Storlek i kvm (Auto-save efter 1.5s)</Label>
          <AutoSaveInput
            id="size"
            type="number"
            value={currentEvaluation.general.size}
            onAutoSave={handleSizeChange}
            placeholder="t.ex. 65"
          />
        </div>

        {/* Dropdown - omedelbar sparning */}
        <div className="space-y-2">
          <Label>Antal rum (Sparas omedelbart)</Label>
          <AutoSaveSelect
            value={currentEvaluation.general.rooms}
            onAutoSave={handleRoomsChange}
            placeholder="Välj antal rum"
            options={roomOptions}
          />
        </div>

        {/* Checkbox - omedelbar sparning */}
        <div className="space-y-2">
          <Label>Underhåll och renoveringar</Label>
          <AutoSaveCheckbox
            checked={currentEvaluation.financial.majorMaintenanceDone || false}
            onAutoSave={handleMaintenanceChange}
            id="maintenance"
          >
            Större underhåll/renovering genomförd (Sparas omedelbart)
          </AutoSaveCheckbox>
        </div>

        {/* Textarea exempel */}
        <div className="space-y-2">
          <Label htmlFor="comments">Kommentarer (Auto-save efter 1.5s)</Label>
          <AutoSaveInput
            id="comments"
            component="textarea"
            value={currentEvaluation.physical.comments}
            onAutoSave={(value) => updateField('physical', 'comments', value)}
            placeholder="Skriv dina kommentarer här..."
            className="min-h-[100px]"
          />
        </div>

        {/* Info om auto-save */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Auto-save funktionalitet:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Textfält: Sparas 1.5 sekunder efter att du slutat skriva</li>
            <li>• Dropdowns och checkboxes: Sparas omedelbart vid val</li>
            <li>• Osparade ändringar varnar vid navigering bort</li>
            <li>• Status visas i nedre högra hörnet</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}