import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface CreateEvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (address: string) => Promise<void>;
}

export const CreateEvaluationModal = ({ open, onOpenChange, onContinue }: CreateEvaluationModalProps) => {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleContinue = async () => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setError('Adress är obligatorisk för att skapa en utvärdering');
      return;
    }
    
    try {
      await onContinue(trimmedAddress);
      setAddress(''); // Reset för nästa gång
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte skapa utvärdering');
    }
  };

  const handleCancel = () => {
    setAddress('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Ny lägenhetsutvärdering</DialogTitle>
          <DialogDescription className="text-center">
            Ange adressen för lägenheten du vill utvärdera
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="address">Adress</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="address"
                placeholder="T.ex. Storgatan 1, Stockholm"
                value={address}
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && address.trim()) {
                    handleContinue();
                  }
                }}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (error) setError(''); // Clear error when user starts typing
                }}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Avbryt
          </Button>
          <Button 
            onClick={handleContinue} 
            disabled={!address.trim()}
            className="flex-1"
          >
            Fortsätt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};