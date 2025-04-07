import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { envoyerRequeteApi } from '@/app/apis/api';
import { format } from 'date-fns';
import { UserContext } from '@/app/contexts/UserContext';
import { ParamsContext } from '@/app/contexts/ParamsContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, Plus, Minus } from 'lucide-react';
import { SelectList } from '@/components/ui/select-list';
import ArticleVenteModalCaisse from './ArticleVenteModalCaisse';

// Props pour le modal
interface AddVenteModalCaisseProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

// Interface pour la réponse de l'API get_ventes_possibles
interface GetVentesPossiblesResponseItem {
  get_ventes_possibles: {
    code: number;
    message: string;
    datas: ArticlePossible[];
  };
}

// Types pour les articles et les détails de vente
export interface ArticlePossible {
  id_article: number;
  nom_article: string;
  nom_type: string;
  qte: number;
  pu_boutique: number;
  pu_livreur: number;
  pu_revente: number;
  type_prix?: number;
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
  id_type_vente?: number;
  id_client?: number;
}

// Interface pour la réponse de l'API save_vente
interface SaveVenteResponseItem {
  save_vente: string; // "OK" en cas de succès
}

export default function AddVenteModalCaisse({ 
  isOpen, 
  onClose,
  onSave
}: AddVenteModalCaisseProps) {
  const { toast } = useToast();
  const { user } = useContext(UserContext);
  const { params: siteParams } = useContext(ParamsContext);

  // États principaux
  const [articlesPossibles, setArticlesPossibles] = useState<ArticlePossible[]>([]);
  const [venteDetails, setVenteDetails] = useState<ArticleVenteDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // États pour les sélections
  const [selectedTypeVente, setSelectedTypeVente] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  // État pour le modal d'article
  const [showArticleModal, setShowArticleModal] = useState<boolean>(false);
  const [articleToSell, setArticleToSell] = useState<ArticlePossible | null>(null);

  // Fonction pour rechercher les articles disponibles
  const handleRechercherArticles = useCallback(async (): Promise<void> => {
    if (!user?.id_site) {
      setIsLoading(false);
      toast({
        title: "Attention",
        description: "Vous n'êtes pas associé à un site. Veuillez contacter l'administrateur.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const dateString = format(new Date(), 'yyyy-MM-dd');
      console.log("Date formatée:", dateString);
      // L'ordre correct des paramètres est (id_boul, id_site, date)
      // Utiliser l'ID de la boulangerie associée au site de l'utilisateur
      const siteBakeryId = siteParams?.sites?.find(site => site.id_site === user.id_site)?.id_boul || 0;
      const query = `SELECT * FROM get_ventes_possibles(${siteBakeryId}, ${user.id_site}, '${dateString}')`;
      
      console.log("Envoi de la requête:", query);
      const response = await envoyerRequeteApi<GetVentesPossiblesResponseItem[]>('boulangerie', query);
      console.log("Réponse reçue:", response);
      
      // Vérifier si la réponse a la structure attendue
      if (response && 
          Array.isArray(response) && 
          response.length > 0 && 
          response[0].get_ventes_possibles && 
          response[0].get_ventes_possibles.code === 200 && 
          Array.isArray(response[0].get_ventes_possibles.datas)) {
        
        // Extraire les données correctement
        const articlesData = response[0].get_ventes_possibles.datas;
        setArticlesPossibles(articlesData);
        
        if (articlesData.length === 0) {
          toast({
            title: "Information",
            description: "Aucun article disponible pour votre site aujourd&apos;hui",
          });
        }
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les articles disponibles",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des articles:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération des articles",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user?.id_site, siteParams]);

  // Charger la liste d'articles possibles automatiquement au chargement
  useEffect(() => {
    if (isOpen) {
      handleRechercherArticles();
    }
  }, [isOpen, handleRechercherArticles]);

  // Filtrage des articles basé sur le terme de recherche
  const filteredArticles = searchTerm 
    ? articlesPossibles.filter(article => 
        article.nom_article.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.nom_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : articlesPossibles;

  // Calculer la somme des quantités par article (en cas de doublons)
  const articlesUniques = useMemo(() => {
    const articlesMap = new Map();
    
    filteredArticles.forEach(article => {
      const key = article.id_article;
      if (articlesMap.has(key)) {
        // Si l'article existe déjà, ajouter la quantité
        const existingArticle = articlesMap.get(key);
        existingArticle.qte += article.qte;
      } else {
        // Sinon, ajouter l'article à la map
        articlesMap.set(key, { ...article });
      }
    });
    
    // Convertir la map en tableau et trier par nom d'article
    return Array.from(articlesMap.values()).sort((a, b) => 
      a.nom_article.localeCompare(b.nom_article)
    );
  }, [filteredArticles]);

  // Gérer la sélection d'un article
  const handleSelectArticle = (article: ArticlePossible): void => {
    // Au lieu d'ajouter directement l'article au panier, on ouvre le modal
    setArticleToSell(article);
    setShowArticleModal(true);
  };

  // Ajouter un article à la vente
  const handleAjouterArticle = (venteDetail: ArticleVenteDetail): void => {
    setVenteDetails([...venteDetails, venteDetail]);
    setShowArticleModal(false);
    setArticleToSell(null);

    toast({
      title: "Article ajouté",
      description: `${venteDetail.qte} ${venteDetail.nom_article} ajouté(s) à la vente`,
    });
  };

  // Supprimer un article de la vente
  const handleSupprimerArticle = (index: number): void => {
    const newDetails = [...venteDetails];
    newDetails.splice(index, 1);
    setVenteDetails(newDetails);
  };

  // Fonction pour mettre à jour un détail de vente
  const handleUpdateDetail = (index: number, field: string, value: unknown): void => {
    const updatedDetails = [...venteDetails];
    
    // Mise à jour du champ spécifié
    if (field === 'qte') {
      const qte = parseFloat(value as string);
      updatedDetails[index].qte = qte;
      updatedDetails[index].mt_ligne = qte * updatedDetails[index].pu;
      updatedDetails[index].mt_encaisse = qte * updatedDetails[index].pu; // Mettre à jour le montant encaissé également
    } else if (field === 'pu') {
      const pu = parseFloat(value as string);
      updatedDetails[index].pu = pu;
      updatedDetails[index].mt_ligne = updatedDetails[index].qte * pu;
      updatedDetails[index].mt_encaisse = updatedDetails[index].qte * pu; // Mettre à jour le montant encaissé également
    } else if (field === 'mt_encaisse') {
      updatedDetails[index].mt_encaisse = parseFloat(value as string);
    } else if (field === 'type_prix') {
      updatedDetails[index].type_prix = Number(value) as PrixOption;
    } else {
      // @ts-expect-error - Champ dynamique
      updatedDetails[index][field] = value;
    }
    
    setVenteDetails(updatedDetails);
  };

  // Sauvegarder la vente
  const handleSaveVente = async (): Promise<void> => {
    if (venteDetails.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun article n'a été ajouté à la vente.",
        variant: "destructive"
      });
      return;
    }

    // Vérifier que le type de vente est sélectionné
    if (!selectedTypeVente) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type de vente.",
        variant: "destructive"
      });
      return;
    }

    // Vérifier que le client est sélectionné
    if (!selectedClient) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un client.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const dateString = format(new Date(), 'yyyy-MM-dd');
      const idSite = user?.id_site || 0;
      const idAgent = user?.id_agent || 0;

      // Construire les requêtes SQL pour chaque détail
      const detailsRequetes = [];
      
      for (const detail of venteDetails) {
        // Déterminer l'ID du client (si fourni ou utiliser selectedClient)
        const idClient = detail.id_client || selectedClient;
        
        // Déterminer le type de vente (si fourni ou utiliser selectedTypeVente)
        const idTypeVente = detail.id_type_vente || selectedTypeVente;
        const val_neutre = '#';
        
        // Ajouter la requête SQL pour ce détail
        const detailSql = `
          INSERT INTO detail_vente (id_site, id_type, id_article, qte, pu, id_vente, id_client, mt_encaisse)
          VALUES (
            ${idSite},
            ${idTypeVente},
            ${detail.id_article},
            ${detail.qte},
            ${detail.pu},
            ${val_neutre},
            ${idClient},
            ${detail.mt_encaisse || 0}
          )
        `;
        
        detailsRequetes.push(detailSql);
      }
      
      // Combiner toutes les requêtes détaillées en une seule chaîne
      const detailSql = detailsRequetes.join('; ');
      
      // Échapper les apostrophes simples pour éviter les erreurs SQL
      const detailSqlEscaped = detailSql.replace(/'/g, "''");
      
      console.log("Requête de détail:", detailSqlEscaped);
      
      // Créer la requête principale qui inclut tous les détails
      const sql = `
        SELECT * FROM save_vente(${idSite}, '${dateString}', '${detailSqlEscaped}', ${idAgent})
      `;

      console.log("SQL query:", sql);
      const response = await envoyerRequeteApi<SaveVenteResponseItem[]>('boulangerie', sql);
      console.log("Réponse save_vente:", response);

      if (response && response.length > 0 && response[0].save_vente === "OK") {
        toast({
          title: "Succès",
          description: "La vente a été enregistrée avec succès.",
        });
        // Fermer le modal et réinitialiser les états
        setVenteDetails([]);
        setShowConfirmation(false);
        onClose();
        // Appeler le callback onSave si fourni
        if (onSave) {
          onSave();
        }
      } else {
        throw new Error("Erreur lors de l'enregistrement de la vente.");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la vente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmer la sauvegarde
  const handleConfirmation = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSave = () => {
    handleSaveVente();
    setShowConfirmation(false);
  };

  const handleCancelSave = () => {
    setShowConfirmation(false);
  };

  // Calculer les totaux
  const totalVente = useMemo(() => 
    venteDetails.reduce((sum, detail) => sum + detail.mt_ligne, 0),
    [venteDetails]
  );
  const totalEncaisse = useMemo(() => 
    venteDetails.reduce((sum, detail) => sum + detail.mt_encaisse, 0),
    [venteDetails]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600">
            Nouvelle vente
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Informations sur le site et la date (affichage uniquement) */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700">Site: <span className="font-bold">{siteParams?.sites?.find(site => site.id_site === (user?.id_site || 0))?.nom_site || "Non défini"}</span></p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700">Date: <span className="font-bold">{format(new Date(), 'dd/MM/yyyy')}</span></p>
            </div>
          </div>

          {/* Type de vente et Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Type de vente avec SelectList */}
            <div>
              <SelectList
                label="Type de vente"
                items={(siteParams?.typesVente || [])
                  .filter(type => type.id_type !== 44) // Exclure le type avec id=44
                  .map((type: { id_type: number; libelle: string }) => ({
                    id: type.id_type,
                    label: type.libelle
                  }))}
                value={selectedTypeVente}
                onChange={(value) => setSelectedTypeVente(value as number)}
                placeholder="Sélectionner un type de vente"
                searchPlaceholder="Rechercher un type de vente..."
                labelClassName="text-sm font-medium text-gray-900"
                required
              />
            </div>
                        
            {/* Client avec SelectList */}
            <div>
              <SelectList
                label="Client"
                items={(siteParams?.clients || []).map((client: { id_client: number; nom_client: string }) => ({
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
                required
              />
            </div>
          </div>

          {/* Recherche d'articles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800 mb-2 bg-gray-100 p-2 rounded">Articles disponibles</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRechercherArticles}
                disabled={isLoading}
                className="text-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-1" />
                    Actualiser
                  </>
                )}
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                hidden
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Affichage des totaux */}
          {venteDetails.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mb-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1 w-full">
                  <div className="flex justify-between">
                    <span className="font-medium text-green-900">Total vente:</span>
                    <span className="font-bold text-green-900 ml-4">{totalVente.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-green-700">Total encaissé:</span>
                    <span className="font-bold text-green-700 ml-4">{totalEncaisse.toLocaleString()} FCFA</span>
                  </div>
                  
                  {/* Indicateur de paiement */}
                  {totalVente !== totalEncaisse && (
                    <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                      <span className={`font-medium ${totalEncaisse < totalVente ? 'text-orange-600' : 'text-blue-600'}`}>
                        {totalEncaisse < totalVente ? 'Restant à payer:' : 'Trop-perçu:'}
                      </span>
                      <span className={`font-bold ml-4 ${totalEncaisse < totalVente ? 'text-orange-600' : 'text-blue-600'}`}>
                        {Math.abs(totalVente - totalEncaisse).toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  disabled={isSaving}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleConfirmation} 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isSaving || venteDetails.length === 0}
                >
                  {isSaving ? "Sauvegarde en cours..." : "Sauvegarder"}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Liste des articles */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="flex justify-center items-center p-10">
                  <Loader2 className="h-8 w-8 text-red-600 animate-spin mr-2" />
                  <span>Chargement des articles...</span>
                </div>
              ) : articlesUniques.length > 0 ? (
                <div className="bg-white p-3 rounded-md border border-gray-200">
                  <h3 className="font-medium text-gray-800 mb-2 bg-gray-100 p-2 rounded">Articles disponibles ({articlesUniques.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {articlesUniques.map((article) => (
                      <Button
                        key={article.id_article}
                        onClick={() => handleSelectArticle(article)}
                        className="bg-white border border-gray-300 text-left p-2 h-auto flex flex-col items-start hover:bg-red-50 hover:border-red-200 transition-colors"
                        disabled={article.qte <= 0}
                      >
                        <span className="font-medium text-gray-900 truncate w-full">{article.nom_article}</span>
                        <div className="flex justify-between w-full mt-1">
                          <span className="text-sm text-gray-600">{article.pu_boutique} FCFA</span>
                          <Badge 
                            variant={article.qte > 0 ? "default" : "destructive"}
                            className={`text-xs ${article.qte > 0 ? "bg-green-100 text-green-800" : ""}`}
                          >
                            Dispo: {user?.libelle_profil !=="Caissier"?article.qte:"***"}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">
                    Aucun article disponible trouvé pour votre site aujourd&apos;hui
                  </p>
                </div>
              )}
            </div>

            {/* Panier d'articles */}
            <div className="lg:col-span-1">
              <Card className="border border-gray-300">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="h-5 w-5 mr-2 text-red-600"
                    >
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    Panier ({venteDetails.length} article{venteDetails.length !== 1 ? 's' : ''})
                  </h3>
                  
                  {venteDetails.length > 0 ? (
                    <div className="space-y-2">
                      {venteDetails.map((detail, index) => (
                        <div 
                          key={index} 
                          className="p-2 border border-gray-200 rounded-md flex justify-between items-center hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{detail.nom_article}</div>
                            <div className="text-sm text-gray-600">
                              {detail.qte} x {detail.pu.toLocaleString()} = {detail.mt_ligne.toLocaleString()} FCFA
                            </div>
                            {detail.client && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Client: {detail.client}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateDetail(index, 'qte', (detail.qte + 1).toString())}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium">{detail.qte}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateDetail(index, 'qte', Math.max(1, detail.qte - 1).toString())}
                              className="h-8 w-8 p-0"
                              disabled={detail.qte <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSupprimerArticle(index)}
                            className="text-red-600 hover:bg-red-50 p-1 h-7 w-7 ml-2"
                          >
                            X
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-gray-50 rounded-md">
                      <p className="text-gray-500">Aucun article dans le panier</p>
                    </div>
                  )}
                  
                  {venteDetails.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button 
                        onClick={handleConfirmation} 
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        disabled={isSaving}
                      >
                        {isSaving ? "Sauvegarde en cours..." : "Finaliser la vente"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Modal pour ajouter un article */}
          {showArticleModal && articleToSell && (
            <ArticleVenteModalCaisse
              article={articleToSell}
              onValiderArticle={handleAjouterArticle}
              onClose={() => {
                setShowArticleModal(false);
                setArticleToSell(null);
              }}
            />
          )}

          {/* Dialog de confirmation */}
          {showConfirmation && (
            <Dialog open={showConfirmation} onOpenChange={handleCancelSave}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Confirmation de la vente</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>Êtes-vous sûr de vouloir finaliser cette vente de {venteDetails.length} article(s) pour un total de {totalVente.toLocaleString()} FCFA ?</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelSave}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleConfirmSave} 
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirmer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};