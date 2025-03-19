'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LoadingSpinnerProps {
  isOpen: boolean;
}

export function LoadingSpinner({ isOpen }: LoadingSpinnerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[300px] flex items-center justify-center p-8">
        <DialogHeader className="sr-only">
          <DialogTitle>Chargement</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium">Chargement en cours...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
