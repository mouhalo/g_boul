'use client';

import { useEffect, useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { SelectList } from '@/components/ui/select-list';
import { UserContext } from '@/app/contexts/UserContext';
import { ParamsContext } from '@/app/contexts/ParamsContext';

// Type pour les options de prix
export type PrixOption = 1 | 2 | 3 | 4; // 1: Boutique, 2: Livreur, 3: Revendeur, 4: Prix libre

// Types pour le composant
interface ArticleVenteModalCaisseProps {
  article: {
    id_article: number;
    nom_article: string;
    nom_type: string;
    qte: number;
    pu_boutique: number;
    pu_livreur: number;
    pu_revente: number;
    puLibre: number;
  };
  onValiderArticle: (venteDetail: ArticleVenteDetail) => void;
  onClose: () => void;
}

interface ArticleVenteDetail {
  id_article: number;
  nom_article: string;
  nom_type: string;
  qte: number;
  pu: number;
  mt_ligne: number;
  mt_encaisse: number;
  client?: string;
  type_prix: PrixOption;
  id_type_vente?: number;
  id_client?: number;
}

export default function ArticleVenteModalCaisse({
  article,
  onValiderArticle,
  onClose
}: ArticleVenteModalCaisseProps) {
  // États pour les détails de l'article
  const [quantite, setQuantite] = useState<number>(1);
  const [typePrix, setTypePrix] = useState<PrixOption>(1); // 1 = boutique, 2 = livreur, 3 = revente, 4 = prix libre
  const [prixUnitaire, setPrixUnitaire] = useState<number>(article.pu_boutique);
 
  const [montantLigne, setMontantLigne] = useState<number>(article.pu_boutique);
  const [montantEncaisse, setMontantEncaisse] = useState<number>(article.pu_boutique);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useContext(UserContext);
  // Contexte des paramètres pour accéder à la liste des clients
  const { params } = useContext(ParamsContext);
  const clients = params?.clients || [];

  // Mettre à jour le prix unitaire lorsque le type de prix change
  useEffect(() => {
    switch (typePrix) {
      case 1:
        setPrixUnitaire(article.pu_boutique);
        break;
      case 2:
        setPrixUnitaire(article.pu_livreur);
        break;
      case 3:
        setPrixUnitaire(article.pu_revente);
        break;
      case 4:
        // Pour prix libre, utiliser une valeur par défaut de 0 si puLibre est undefined ou NaN
        setPrixUnitaire(article.puLibre || 0);
        break;
      default:
        setPrixUnitaire(article.pu_boutique);
    }
  }, [typePrix, article]);

  // Calculer le montant de la ligne lorsque la quantité ou le prix unitaire change
  useEffect(() => {
    const montant = quantite * prixUnitaire;
    setMontantLigne(montant);
    setMontantEncaisse(montant); // Par défaut, le montant encaissé est égal au montant de la ligne
  }, [quantite, prixUnitaire]);

  // Gérer la validation de l'article
  const handleValider = () => {
    setIsLoading(true);
    
    // Trouver le client sélectionné pour récupérer son nom
    const clientObj = selectedClient 
      ? clients.find(c => c.id_client === selectedClient) 
      : undefined;
    
    // Créer l'objet de détail de vente
    const venteDetail: ArticleVenteDetail = {
      id_article: article.id_article,
      nom_article: article.nom_article,
      nom_type: article.nom_type,
      qte: quantite,
      pu: prixUnitaire,
      mt_ligne: montantLigne,
      mt_encaisse: montantEncaisse,
      client: clientObj?.nom_client,
      type_prix: typePrix,
      id_type_vente: undefined,
      id_client: selectedClient || undefined
    };
    
    // Appeler la fonction de validation
    onValiderArticle(venteDetail);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un article à la vente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Informations sur l'article */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="font-medium text-gray-900">{article.nom_article}</h3>
            <p className="text-sm text-gray-600">{article.nom_type} - Stock: {user?.libelle_profil !=="Caissier"?article.qte:"***"}</p>
          </div>
          
          {/* Type de prix */}
          <div className="space-y-2">
            <Label>Type de prix</Label>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="prix-boutique" 
                  name="typePrix" 
                  value="1" 
                  checked={typePrix === 1} 
                  onChange={() => setTypePrix(1)} 
                />
                <Label htmlFor="prix-boutique">Boutique ({article.pu_boutique.toLocaleString()} FCFA)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="prix-livreur" 
                  name="typePrix" 
                  value="2" 
                  checked={typePrix === 2} 
                  onChange={() => setTypePrix(2)} 
                />
                <Label htmlFor="prix-livreur">Livreur ({article.pu_livreur.toLocaleString()} FCFA)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="prix-revente" 
                  name="typePrix" 
                  value="3" 
                  checked={typePrix === 3} 
                  onChange={() => setTypePrix(3)} 
                />
                <Label htmlFor="prix-revente">Revente ({article.pu_revente.toLocaleString()} FCFA)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="prix-libre" 
                  name="typePrix" 
                  value="4" 
                  checked={typePrix === 4} 
                  onChange={() => setTypePrix(4)} 
                />
                <Label htmlFor="prix-libre">Prix libre</Label>
              </div>
            </div>
          </div>
          
          {/* Quantité */}
          <div className="space-y-2">
            <Label htmlFor="quantite">Quantité</Label>
            <Input 
              id="quantite"
              type="number"
              min="1"
              max={article.qte}
              value={quantite}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantite(Number(e.target.value))}
            />
            {quantite > article.qte && (
              <p className="text-red-500 text-sm">La quantité dépasse le stock disponible!</p>
            )}
          </div>
          {/* Prix unitaire - visible uniquement pour prix libre */}
              {typePrix === 4 && (
                <div className="space-y-2">
                  <Label htmlFor="prixUnitaire">Prix unitaire</Label>
                  <Input 
                    id="prixUnitaire"
                    type="number"
                    min="0"
                    value={prixUnitaire}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrixUnitaire(Number(e.target.value))}
                  />
                </div>
              )}
          {/* Montant et Montant encaissé côte à côte */}
          <div className="grid grid-cols-2 gap-4">
            {/* Montant */}
            <div className="space-y-2">
              <Label>Montant</Label>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-green-900">{montantLigne.toLocaleString()} FCFA</p>
              </div>
            </div>
            
            {/* Montant encaissé */}
            <div className="space-y-2">
              <Label htmlFor="montantEncaisse">Montant encaissé</Label>
              <Input 
                id="montantEncaisse"
                type="number"
                className="bg-gray-50 p-3 rounded-md font-medium text-green-900"
                min="0"
                value={montantEncaisse}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMontantEncaisse(Number(e.target.value))}
              />
            </div>
          </div>
          
          {/* Client avec SelectList */}
          <div className="mb-4">
            <SelectList
              label="Client"
              className="bg-gray-50 p-3 rounded-md font-medium text-green-900"
              items={clients.map((client: { id_client: number; nom_client: string }) => ({
                id: client.id_client,
                label: client.nom_client
              }))}
              value={selectedClient}
              onChange={(value) => setSelectedClient(value as number)}
              placeholder="Sélectionner un client"
              searchPlaceholder="Rechercher un client..."
              labelClassName="text-sm font-medium text-gray-900"
              renderItem={(client, isSelected) => (
                <div className="flex justify-between w-full">
                  <span className={isSelected ? "font-medium" : ""}>{client.label}</span>
                </div>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white">

            Annuler
          </Button>
          <Button 
            onClick={handleValider} 
            disabled={isLoading || quantite <= 0 || quantite > article.qte}
            className="bg-green-600 hover:bg-green-900 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validation...
              </>
            ) : (
              "Valider"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}