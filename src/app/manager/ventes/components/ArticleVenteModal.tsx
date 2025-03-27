'use client';

import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ParamsContext } from '@/app/contexts/ParamsContext';
import { SelectList } from '@/components/ui/select-list';

// Types
export interface ArticlePossible {
  id_article: number;
  nom_article: string;
  nom_type: string;
  qte: number;
  pu_boutique: number;
  pu_livreur: number;
  pu_revente: number;
}

export type PrixOption = 1 | 2 | 3 | 4; // 1: Boutique, 2: Livreur, 3: Revendeur, 4: Prix libre

export interface ArticleVenteDetail {
  id_article: number;
  nom_article: string;
  nom_type: string;
  qte: number;
  pu: number;
  mt_ligne: number;
  mt_encaisse: number;
  client?: string;
  type_prix: PrixOption;
  id_type_vente?: number; // ID du type de vente
  id_client?: number;     // ID du client sélectionné
}

interface ArticleVenteModalProps {
  article: ArticlePossible;
  qteVente?: number;
  prixOption?: PrixOption;
  puLibre?: number;
  mtEncaisse?: number;
  totalLigne?: number;
  onClose: () => void;
  onValiderArticle: (venteDetail: ArticleVenteDetail) => void;
  onMtEncaisseChange: (value: number) => void; // Nouvelle prop
}

export default function ArticleVenteModal({ 
  article, 
  qteVente: initialQteVente = 1, 
  prixOption: initialPrixOption = 1, 
  puLibre: initialPuLibre = 0, 
  mtEncaisse: initialMtEncaisse = 0, 
  totalLigne: initialTotalLigne = 0, 
  onMtEncaisseChange,
  onClose, 
  onValiderArticle 
}: ArticleVenteModalProps) {
  // États locaux
  const [qteVente, setQteVente] = useState<number>(initialQteVente);
  const [prixOption, setPrixOption] = useState<PrixOption>(initialPrixOption);
  const [puLibre, setPuLibre] = useState<number>(initialPuLibre);
  const [mtEncaisse, setMtEncaisse] = useState<number>(initialMtEncaisse);
  const [totalLigne, setTotalLigne] = useState<number>(initialTotalLigne);
  
  // États pour les sélections (modifiés pour le nouveau composant)
  const [selectedTypeVente, setSelectedTypeVente] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  // Contexte des paramètres
  const { params } = useContext(ParamsContext);
  const typesVente = params?.typesVente || [];
  const clients = params?.clients || [];

  // Calculer le total de la ligne à chaque changement de quantité ou de prix
  useEffect(() => {
    let prixUnitaire = 0;
    
    switch (prixOption) {
      case 1:
        prixUnitaire = article.pu_boutique;
        break;
      case 2:
        prixUnitaire = article.pu_livreur;
        break;
      case 3:
        prixUnitaire = article.pu_revente;
        break;
      case 4:
        prixUnitaire = puLibre;
        break;
    }
    
    const total = qteVente * prixUnitaire;
    setTotalLigne(total);
    
 
  }, [qteVente, prixOption, puLibre, article, mtEncaisse, totalLigne]);

  // Valider la vente
  const handleValider = () => {
    if (qteVente <= 0 || qteVente > article.qte) {
      return; // Validation gérée par le composant parent
    }

    let prixUnitaire = 0;
    
    switch (prixOption) {
      case 1:
        prixUnitaire = article.pu_boutique;
        break;
      case 2:
        prixUnitaire = article.pu_livreur;
        break;
      case 3:
        prixUnitaire = article.pu_revente;
        break;
      case 4:
        prixUnitaire = puLibre;
        break;
    }

    // Trouver le client sélectionné pour récupérer son nom
    const clientObj = selectedClient 
      ? clients.find(c => c.id_client === selectedClient) 
      : undefined;

    const venteDetail: ArticleVenteDetail = {
      id_article: article.id_article,
      nom_article: article.nom_article,
      nom_type: article.nom_type,
      qte: qteVente,
      pu: prixUnitaire,
      mt_ligne: totalLigne,
      mt_encaisse: mtEncaisse,
      client: clientObj?.nom_client,
      type_prix: prixOption,
      id_type_vente: selectedTypeVente || undefined,
      id_client: selectedClient || undefined
    };

    onValiderArticle(venteDetail);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-200">
        
        {/* Titre et informations */}
        <h2 className="text-xl font-bold mb-2 text-red-700 text-center">{article.nom_article}</h2>
        <p className="text-sm text-gray-700 text-center mb-4">
          <span className="font-medium text-gray-900">Type :</span> {article.nom_type} |
          <span className="font-medium text-gray-900"> Disponible :</span> {article.qte}
        </p>

        {/* Sélection du type de prix */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">Type de prix</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 1, label: "Boutique", value: article.pu_boutique },
              { id: 2, label: "Livreur", value: article.pu_livreur },
              { id: 3, label: "Revendeur", value: article.pu_revente },
              { id: 4, label: "Prix libre", value: null }
            ].map(({ id, label, value }) => (
              <label
                key={id}
                className={`flex items-center space-x-2 p-3 border rounded-md text-gray-800 cursor-pointer transition 
                ${value === 0 && id !== 4 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"} 
                ${prixOption === id ? "border-red-600 bg-red-50" : "border-gray-300"}`}
              >
                <input
                  type="radio"
                  name="prixOption"
                  value={id}
                  checked={prixOption === id}
                  onChange={() => setPrixOption(id as PrixOption)}
                  disabled={value === 0 && id !== 4}
                  className="h-4 w-4 accent-red-600"
                />
                <span>{label} {value !== null && `(${value} FCFA)`}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Prix unitaire libre */}
        {prixOption === 4 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-1">Prix unitaire libre</label>
            <Input
              type="number"
              value={puLibre}
              onChange={(e) => setPuLibre(parseFloat(e.target.value))}
              className="focus:ring-red-600 focus:border-red-600 border-gray-300 text-gray-500 p-2 rounded text-sm"
              placeholder="Saisir le prix libre"
            />
          </div>
        )}

        {/* Type de vente avec SelectList */}
        <div className="mb-4">
          <SelectList
            label="Type de vente"
            items={typesVente.map((type: { id_type: number; libelle: string }) => ({
              id: type.id_type,
              label: type.libelle
            }))}
            value={selectedTypeVente}
            onChange={(value) => setSelectedTypeVente(value as number)}
            placeholder="Sélectionner un type de vente"
            searchPlaceholder="Rechercher un type de vente..."
            labelClassName="text-sm font-medium text-gray-900"
          />
        </div>

        {/* Client avec SelectList */}
        <div className="mb-4">
          <SelectList
            label="Client"
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

        {/* Quantité vendue */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">Quantité vendue</label>
          <Input
            type="number"
            value={qteVente}
            onChange={(e) => setQteVente(parseFloat(e.target.value))}
            min="1"
            max={article.qte}
            className="focus:ring-red-600 focus:border-red-600 border-gray-300 text-gray-500 p-2 rounded text-sm"
            placeholder="Saisir la quantité"
          />
          <p className="text-xs text-gray-600 mt-1">Stock maximum : {article.qte}</p>
        </div>

        {/* Montant total */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">Montant total</label>
          <Input
            type="number"
            value={totalLigne}
            readOnly
            className="bg-gray-100 border-gray-300 text-gray-900"
          />
        </div>

        {/* Montant encaissé */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">Montant encaissé</label>
          <Input
            type="number"
            value={mtEncaisse}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : Number(e.target.value);
              setMtEncaisse(value); // Mettre à jour l'état local
              onMtEncaisseChange(value); // Informer le parent
            }}
            className="focus:ring-red-600 focus:border-red-600 border-gray-300 text-green-700 p-2 rounded text-sm"
          />
        </div>

        {/* Boutons de validation et annulation */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-400 text-gray-700 hover:bg-gray-100"
          >
            Annuler
          </Button>
          <Button
            onClick={handleValider}
            className="bg-red-700 hover:bg-red-800 text-white px-4"
          >
            Valider
          </Button>
        </div>
      </div>
    </div>
  );
}