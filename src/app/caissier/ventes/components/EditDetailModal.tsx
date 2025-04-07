'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UserContext } from '@/app/contexts/UserContext';
import { X, DollarSign, RotateCcw, Save, Loader2 } from 'lucide-react';
import { ArticleVendu } from '@/app/manager/ventes/types';
import { envoyerRequeteApi } from '@/app/apis/api';

interface EditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetailUpdated: () => void;
  detail: ArticleVendu | null;
}

// Types d'action possibles
enum ActionType {
  NONE = 'none',
  ENCAISSER = 'encaisser',
  RETOURNER = 'retourner'
}

const EditDetailModal: React.FC<EditDetailModalProps> = ({
  isOpen,
  onClose,
  onDetailUpdated,
  detail
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(ActionType.NONE);
  const [montantEncaisse, setMontantEncaisse] = useState(0);
  const [qteRetournee, setQteRetournee] = useState(0);
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (isOpen && detail) {
      // Réinitialiser l'état lors de l'ouverture
      setActionType(ActionType.NONE);
      setMontantEncaisse(0);
      setQteRetournee(0);
    }
  }, [isOpen, detail]);

  // Vérifier si la valeur maximale est dépassée
  const handleMontantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setMontantEncaisse(0);
    } else {
      // Le montant encaissé ne peut pas dépasser le montant restant à payer
      const montantDejaEncaisse = detail ? detail.mt_encaisse || 0 : 0;
      const montantTotal = detail ? detail.total : 0;
      const montantRestant = montantTotal - montantDejaEncaisse;
      setMontantEncaisse(Math.min(value, montantRestant));
    }
  };

  const handleQteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setQteRetournee(0);
    } else {
      // La quantité retournée ne peut pas dépasser la quantité vendue
      const maxQte = detail ? detail.qte : 0;
      setQteRetournee(Math.min(value, maxQte));
    }
  };

  const handleSubmit = async () => {
    if (!detail || !user) return;
    
    // Validation des données selon le type d'action
    if (actionType === ActionType.ENCAISSER && montantEncaisse <= 0) {
      toast({
        title: "Erreur de validation",
        description: "Le montant à encaisser doit être supérieur à 0",
        variant: "destructive",
      });
      return;
    }

    if (actionType === ActionType.RETOURNER && qteRetournee <= 0) {
      toast({
        title: "Erreur de validation",
        description: "La quantité retournée doit être supérieure à 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Appel à la fonction save_invendus
      const query = `SELECT public.save_invendus(
        ${detail.id_detail},
        ${detail.id_vente},
        ${detail.id_client},
        ${actionType === ActionType.RETOURNER ? qteRetournee : 0},
        ${actionType === ActionType.ENCAISSER ? montantEncaisse : 0},
        ${user.id_agent}
      ) as result`;
      
      console.log('Requête SQL:', query);
      
      const response = await envoyerRequeteApi<{result: string}[]>('boulangerie', query);
      
      if (response && response.length > 0) {
        const result = response[0].result;
        
        if (result === 'OK') {
          toast({
            title: "Succès",
            description: actionType === ActionType.ENCAISSER 
              ? "Le montant a été encaissé avec succès" 
              : "La quantité retournée a été enregistrée avec succès",
          });
          
          onDetailUpdated();
          onClose();
        } else {
          toast({
            title: "Erreur",
            description: result || "Une erreur est survenue lors de l'opération",
            variant: "destructive",
          });
        }
      } else {
        throw new Error("Aucune réponse du serveur");
      }
    } catch (error) {
      console.error("Erreur lors de l'opération:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'opération. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!detail) return null;

  // Premier écran : choix de l'action
  if (actionType === ActionType.NONE) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-xl">
          <div className="relative">
            <DialogHeader className="p-5 bg-gray-50 border-b border-gray-200">
              <DialogTitle className="text-xl font-bold text-red-600">
                Que voulez-vous faire ?
              </DialogTitle>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogHeader>
            
            <div className="p-6 bg-white">
              <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-2">Détails de larticle</h3>
                <div className="space-y-1">
                  <p className="flex justify-between text-sm py-1">
                    <span className="font-medium text-gray-600">Article:</span> 
                    <span className="text-gray-900">{detail.nom_article}</span>
                  </p>
                  <p className="flex justify-between text-sm py-1">
                    <span className="font-medium text-gray-600">Quantité:</span> 
                    <span className="text-gray-900">{detail.qte}</span>
                  </p>
                  <p className="flex justify-between text-sm py-1">
                    <span className="font-medium text-gray-600">Prix unitaire:</span> 
                    <span className="text-gray-900">{detail.pu.toLocaleString()} FCFA</span>
                  </p>
                  <p className="flex justify-between text-sm py-1">
                    <span className="font-medium text-gray-600">Total:</span> 
                    <span className="text-gray-900">{detail.total.toLocaleString()} FCFA</span>
                  </p>
                  <p className="flex justify-between text-sm py-1">
                    <span className="font-medium text-gray-600">Client:</span> 
                    <span className="text-gray-900">{detail.nom_client}</span>
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="flex justify-between text-sm py-1">
                      <span className="font-medium text-gray-600">Déjà encaissé:</span> 
                      <span className="text-gray-900">{detail.mt_encaisse?.toLocaleString() || '0'} FCFA</span>
                    </p>
                    <p className="flex justify-between text-sm py-1">
                      <span className="font-medium text-gray-600">Reste à encaisser:</span> 
                      <span className="font-medium text-green-600">{(detail.total - (detail.mt_encaisse || 0)).toLocaleString()} FCFA</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => setActionType(ActionType.ENCAISSER)}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center h-14 rounded-md"
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Faire un Encaissement
                </Button>
                
                <Button 
                  onClick={() => setActionType(ActionType.RETOURNER)}
                  className="bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center h-14 rounded-md"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Retourner les invendus
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border border-red-300 text-red-500 hover:bg-red-50 h-12 rounded-md mt-2"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Écran d'encaissement
  if (actionType === ActionType.ENCAISSER) {
    const montantDejaEncaisse = detail.mt_encaisse || 0;
    const montantTotal = detail.total;
    const montantRestant = montantTotal - montantDejaEncaisse;
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-xl">
          <div className="relative">
            <DialogHeader className="p-5 bg-green-50 border-b border-green-100">
              <DialogTitle className="text-xl font-bold text-green-600">
                Encaisser un montant
              </DialogTitle>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-green-100"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogHeader>
            
            <div className="p-6 bg-white">
              <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-2">Détails de larticle</h3>
                <div className="space-y-1">
                  <p className="flex justify-between text-sm py-1">
                    <span className="font-medium text-gray-600">Article:</span> 
                    <span className="text-gray-900">{detail.nom_article}</span>
                  </p>
                  <p className="flex justify-between text-sm py-1">
                    <span className="font-medium text-gray-600">Quantité:</span> 
                    <span className="text-gray-900">{detail.qte}</span>
                  </p>
                  <p className="flex justify-between text-sm py-1">
                    <span className="font-medium text-gray-600">Prix unitaire:</span> 
                    <span className="text-gray-900">{detail.pu.toLocaleString()} FCFA</span>
                  </p>
                  <p className="flex justify-between text-sm py-1">
                    <span className="font-medium text-gray-600">Total:</span> 
                    <span className="text-gray-900">{detail.total.toLocaleString()} FCFA</span>
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="flex justify-between text-sm py-1">
                      <span className="font-medium text-gray-600">Déjà encaissé:</span> 
                      <span className="text-gray-900">{montantDejaEncaisse.toLocaleString()} FCFA</span>
                    </p>
                    <p className="flex justify-between text-sm py-1">
                      <span className="font-medium text-gray-600">Reste à encaisser:</span> 
                      <span className="font-medium text-green-600">{montantRestant.toLocaleString()} FCFA</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="montantEncaisse" className="block text-sm font-medium text-gray-700 mb-2">
                    Montant à encaisser
                  </Label>
                  <Input
                    id="montantEncaisse"
                    type="number"
                    value={montantEncaisse}
                    onChange={handleMontantChange}
                    className="border border-gray-300 rounded-md p-2 w-full text-right font-medium text-gray-900"
                    min="0"
                    max={montantRestant}
                    required
                  />
                  {
                    montantEncaisse > 0 && (
                      <p className="text-sm text-green-600 mt-2 text-center font-medium">
                        {montantEncaisse === montantRestant
                          ? "Encaissement complet: "
                          : "Encaissement partiel: "}
                        {montantEncaisse.toLocaleString()} FCFA
                      </p>
                    )
                  }
                </div>
                
                <div className="grid grid-cols-1 gap-3 mt-8">
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading || montantEncaisse <= 0 || montantEncaisse > montantRestant || montantRestant <= 0}
                    className="bg-green-600 hover:bg-green-700 text-white h-12 rounded-md"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Encaisser
                      </>
                    )}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      onClick={() => setActionType(ActionType.NONE)}
                      className="bg-amber-500 hover:bg-amber-600 text-white h-12 rounded-md"
                    >
                      Retour
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="border border-red-300 text-red-500 hover:bg-red-50 h-12 rounded-md"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Écran de retour
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-xl">
        <div className="relative">
          <DialogHeader className="p-5 bg-amber-50 border-b border-amber-100">
            <DialogTitle className="text-xl font-bold text-amber-600">
              Retourner une quantité
            </DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-amber-100"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          
          <div className="p-6 bg-white">
            <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-2">Détails Article</h3>
              <div className="space-y-1">
                <p className="flex justify-between text-sm py-1">
                  <span className="font-medium text-gray-600">Article:</span> 
                  <span className="text-gray-900">{detail.nom_article}</span>
                </p>
                <p className="flex justify-between text-sm py-1">
                  <span className="font-medium text-gray-600">Quantité:</span> 
                  <span className="text-gray-900">{detail.qte}</span>
                </p>
                <p className="flex justify-between text-sm py-1">
                  <span className="font-medium text-gray-600">Prix unitaire:</span> 
                  <span className="text-gray-900">{detail.pu.toLocaleString()} FCFA</span>
                </p>
                <p className="flex justify-between text-sm py-1">
                  <span className="font-medium text-gray-600">Total:</span> 
                  <span className="text-gray-900">{detail.total.toLocaleString()} FCFA</span>
                </p>
                <p className="flex justify-between text-sm py-1">
                  <span className="font-medium text-gray-600">Client:</span> 
                  <span className="text-gray-900">{detail.nom_client}</span>
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="qteRetournee" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité retournée
                </Label>
                <Input
                  id="qteRetournee"
                  type="number"
                  value={qteRetournee}
                  onChange={handleQteChange}
                  className="border border-gray-300 rounded-md p-2 w-full text-right font-medium text-gray-900"
                  min="0"
                  max={detail.qte}
                  step="0.1"
                  required
                />
                {
                  qteRetournee > 0 && (
                    <p className="text-sm text-amber-600 mt-2 text-center font-medium">
                      {qteRetournee === detail.qte
                        ? "Retour complet: "
                        : "Retour partiel: "}
                      {qteRetournee}
                      {qteRetournee !== detail.qte && ` / ${detail.qte}`}
                    </p>
                  )
                }
              </div>
              
              <div className="grid grid-cols-1 gap-3 mt-8">
                <Button 
                  onClick={handleSubmit}
                  disabled={loading || qteRetournee <= 0 || qteRetournee > detail.qte}
                  className="bg-amber-600 hover:bg-amber-700 text-white h-12 rounded-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Retourner
                    </>
                  )}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => setActionType(ActionType.NONE)}
                    className="bg-green-500 hover:bg-green-600 text-white h-12 rounded-md"
                  >
                    Retour
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="border border-red-300 text-red-500 hover:bg-red-50 h-12 rounded-md"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDetailModal;