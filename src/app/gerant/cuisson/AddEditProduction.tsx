"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { envoyerRequeteApi } from '@/app/apis/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Recette {
  id_recette: number;
  nom_recette: string;
}

interface AddEditProductionProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cuissonId: number;
  bakeryId: number;
}

export default function AddEditProduction({
  open,
  onClose,
  onSuccess,
  cuissonId,
  bakeryId,
}: AddEditProductionProps) {
  const { toast } = useToast();
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [selectedRecette, setSelectedRecette] = useState<number | null>(null);
  const [quantite, setQuantite] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadRecettes = async () => {
      try {
        const query = `
          SELECT id_recette, nom_recette
          FROM list_recettes
          WHERE id_boul = ${bakeryId}
          ORDER BY nom_recette
        `;
        const response = await envoyerRequeteApi('boulangerie', query);
        if (response && Array.isArray(response)) {
          setRecettes(response);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des recettes:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les recettes",
          variant: "destructive",
        });
      }
    };

    if (open) {
      loadRecettes();
    }
  }, [open, bakeryId, toast]);

  const handleSubmit = async () => {
    if (!selectedRecette || quantite <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une recette et spécifier une quantité valide",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const query = `
        INSERT INTO productions (id_cuisson, id_recette, quantite)
        VALUES (${cuissonId}, ${selectedRecette}, ${quantite})
        RETURNING id_production
      `;
      await envoyerRequeteApi('boulangerie', query);
      
      toast({
        title: "Succès",
        description: "Production ajoutée avec succès",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la production:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la production",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une production</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="recette">Recette</Label>
            <select
              id="recette"
              className="w-full p-2 border rounded"
              value={selectedRecette || ''}
              onChange={(e) => setSelectedRecette(Number(e.target.value))}
            >
              <option value="">Sélectionner une recette</option>
              {recettes.map((recette) => (
                <option key={recette.id_recette} value={recette.id_recette}>
                  {recette.nom_recette}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="quantite">Quantité</Label>
            <Input
              id="quantite"
              type="number"
              min="0"
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "En cours..." : "Ajouter"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}