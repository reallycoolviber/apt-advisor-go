import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface InfoButtonProps {
  content: string;
}

export const InfoButton = ({ content }: InfoButtonProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-nature-subtle-beige/50 rounded-full"
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-nature-subtle-beige border-nature-subtle-beige/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-800 text-lg font-semibold">
            Varför är detta viktigt?
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <p className="text-slate-700 leading-relaxed text-sm">
            {content}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};