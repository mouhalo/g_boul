'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SelectList } from '@/components/ui/select-list';
import { UserContext } from '@/app/contexts/UserContext';
import { ParamsContext } from '@/app/contexts/ParamsContext';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Loader2, Save, Receipt } from 'lucide-react';
import { envoyerRequeteApi } from '@/app/apis/api';

// Types
interface TypeDepense {
  id_type: number;
  libelle: string;
}

export interface Depense {
  id_depense: number;
  id_site: number;
  id_boul: number;
  nom_site: string;
  date_op: string;
  id_type_depense: number;
  nom_type: string;
  description: string;
  montant: number;
  id_agent: number;
  nom_agent: string;
}

interface DepenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  depense?: Depense | null;
  isEditing: boolean;
}

const DepenseModal: React.FC<DepenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  depense,
  isEditing
}) => {
  const { toast } = useToast();
  const { user } = useContext(UserContext);
  const { params: siteParams } = useContext(ParamsContext);

  // États du formulaire
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [typeDepense, setTypeDepense] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [montant, setMontant] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [typesDepense, setTypesDepense] = useState<{id: string, label: string}[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState<boolean>(false);

  // Charger les types de dépense
  useEffect(() => {
    const loadTypesDepense = async () => {
      setIsLoadingTypes(true);
      try {
        const query = `
          SELECT id_type, libelle 
          FROM type_variable 
          WHERE nom_variable = 'DEPENSE'
          ORDER BY libelle
        `;
        
        const response = await envoyerRequeteApi<TypeDepense[]>('boulangerie', query);
        
        if (response && Array.isArray(response)) {
          const formattedTypes = response.map(type => ({
            id: type.id_type.toString(),
            label: type.libelle
          }));
          setTypesDepense(formattedTypes);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des types de dépense:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les types de dépense",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTypes(false);
      }
    };
    
    if (isOpen) {
      loadTypesDepense();
    }
  }, [isOpen, toast]);

  // Initialiser le formulaire avec les données de la dépense si en mode édition
  useEffect(() => {
    if (isEditing && depense) {
      setDate(format(new Date(depense.date_op), 'yyyy-MM-dd'));
      setTypeDepense(depense.id_type_depense.toString());
      setDescription(depense.description);
      setMontant(depense.montant.toString());
    } else {
      // Réinitialiser le formulaire en mode ajout
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTypeDepense('');
      setDescription('');
      setMontant('');
    }
  }, [isEditing, depense, isOpen]);

  // Validation du formulaire
  const isFormValid = () => {
    return (
      date.trim() !== '' &&
      typeDepense.trim() !== '' &&
      description.trim() !== '' &&
      montant.trim() !== '' &&
      parseFloat(montant) > 0
    );
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const idSite = user?.id_site || 0;
      const idAgent = user?.id_agent || 0;
      const idDepense = isEditing && depense ? depense.id_depense : 0;
      
      const query = `
        SELECT public.save_depense(
          ${idSite},
          '${date}',
          ${typeDepense},
          '${description.replace(/'/g, "''")}',
          ${parseFloat(montant)},
          ${idAgent},
          ${idDepense}
        ) as result
      `;
      
      console.log("Requête:", query);
      
      const response = await envoyerRequeteApi<{result: string}[]>('boulangerie', query);
      
      if (response && response.length > 0 && response[0].result === 'OK') {
        toast({
          title: "Succès",
          description: isEditing 
            ? "La dépense a été mise à jour avec succès" 
            : "La dépense a été ajoutée avec succès",
        });
        
        onSave();
        onClose();
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'enregistrement",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600 flex items-center">
            <Receipt className="h-6 w-6 mr-2" />
            {isEditing ? "Modifier la dépense" : "Nouvelle dépense"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Site (verrouillé pour le caissier) */}
          <div className="space-y-2">
            <Label htmlFor="site" className="text-gray-700">Site</Label>
            <Input
              id="site"
              type="text"
              value={siteParams?.sites?.find(site => site.id_site === user?.id_site)?.nom_site || ""}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          {/* Date de la dépense */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-gray-700">Date <span className="text-red-500">*</span></Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-gray-300"
              required
            />
          </div>
          
          {/* Type de dépense */}
          <div className="space-y-2">
            <SelectList
              label="Type de dépense"
              labelClassName="text-gray-700"
              items={typesDepense}
              value={typeDepense}
              onChange={(value) => setTypeDepense(value ? value.toString() : '')}
              placeholder="Sélectionner un type de dépense"
              className="w-full"
              searchable={true}
              required
            />
            {isLoadingTypes && (
              <p className="text-xs text-orange-500">Chargement des types de dépense...</p>
            )}
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700">Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-gray-300 min-h-[100px]"
              placeholder="Détails de la dépense..."
              required
            />
          </div>
          
          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant" className="text-gray-700">Montant (FCFA) <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="montant"
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="pr-16 text-right font-medium"
                min="0"
                step="0.01"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">FCFA</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="border-gray-300"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={isSaving || !isFormValid()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Mettre à jour" : "Enregistrer"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepenseModal;