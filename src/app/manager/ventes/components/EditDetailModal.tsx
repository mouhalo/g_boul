'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UserContext } from '@/app/contexts/UserContext';

import { Loader2, Save } from 'lucide-react';
import { ArticleVendu } from '@/app/manager/ventes/types';
import { envoyerRequeteApi } from '@/app/apis/api';

interface EditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetailUpdated: () => void;
  detail: ArticleVendu | null;
}

const EditDetailModal: React.FC<EditDetailModalProps> = ({
  isOpen,
  onClose,
  onDetailUpdated,
  detail
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantite: '',
  });
  const { user } = useContext(UserContext);
  // Charger les données initiales
  useEffect(() => {
    if (detail) {
      setFormData({
        quantite: detail.qte.toString(),
      });
    }
  }, [detail]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!detail) return;
    
    // Validation des données
    const quantite = parseInt(formData.quantite);
   
    
    if (isNaN(quantite) ) {
      toast({
        title: "Erreur de validation",
        description: "La quantité doit être un nombre positif",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Requête SQL pour mettre à jour le détail
      const query = `
        UPDATE detail_vente
        SET qte = ${quantite}, id_agent_update = ${user?.id_agent}
        WHERE id_detail = ${detail.id_detail};
      `;
      
      await envoyerRequeteApi('boulangerie', query);
      
      toast({
        title: "Succès",
        description: "Le détail de vente a été mis à jour avec succès",
      });
      
      onDetailUpdated();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du détail:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le détail. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!detail) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600">
            Modifier le détail de vente
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            {/* Informations sur l'article (non modifiables) */}
            <div className="border rounded-md p-3 bg-gray-50">
              <h3 className="font-medium text-gray-700 mb-2">Informations sur l&apos;article</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Article:</span> {detail.nom_article}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {detail.nom_type}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Client:</span> {detail.nom_client}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {new Date(detail.date_op).toLocaleDateString()}
              </p>
            </div>
            
            {/* Champs modifiables */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantite" className="text-gray-700">Quantité</Label>
                  <Input
                    id="quantite"
                    name="quantite"
                    type="number"
                    value={formData.quantite}
                    onChange={handleInputChange}
                    className="mt-1"
                    min="0"
                    required
                  />
                </div>
                
              </div>
              
             
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDetailModal;