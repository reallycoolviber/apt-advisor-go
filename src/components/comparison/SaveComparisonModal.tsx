import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';

interface SaveComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  loading?: boolean;
}

export const SaveComparisonModal: React.FC<SaveComparisonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Spara jämförelse
          </DialogTitle>
          <DialogDescription>
            Ge din jämförelse ett namn så att du enkelt kan hitta den senare.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comparison-name">Namn på jämförelse</Label>
            <Input
              id="comparison-name"
              placeholder="T.ex. Södermalm lägenheter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || loading}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Sparar...' : 'Spara'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};