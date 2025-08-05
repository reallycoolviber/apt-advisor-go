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
  onContinue: (address: string) => void;
}

export const CreateEvaluationModal = ({ open, onOpenChange, onContinue }: CreateEvaluationModalProps) => {
  const [address, setAddress] = useState('');

  const handleContinue = () => {
    if (address.trim()) {
      onContinue(address.trim());
      setAddress(''); // Reset för nästa gång
    }
  };

  const handleCancel = () => {
    setAddress('');
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
                onChange={(e) => setAddress(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && address.trim()) {
                    handleContinue();
                  }
                }}
              />
            </div>
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