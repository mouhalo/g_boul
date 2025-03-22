import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';

interface DeleteVenteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  venteId: number;
  venteDate: string;
}

const DeleteVenteDialog: React.FC<DeleteVenteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  venteId,
  venteDate,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer la vente #{venteId} du {venteDate} ?
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteVenteDialog;
