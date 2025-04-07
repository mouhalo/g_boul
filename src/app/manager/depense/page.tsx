'use client';

import { useEffect, useState, useCallback, useContext} from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { envoyerRequeteApi } from '@/app/apis/api';
import { UserContext } from '@/app/contexts/UserContext';
import { ParamsContext } from '@/app/contexts/ParamsContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Filter, 
  Calendar, 
  Edit, 
  Plus, 
  ListFilter, 
  Loader2, 
  Search, 
  Trash2, 
  Receipt 
} from 'lucide-react';
import { SelectList } from '@/components/ui/select-list';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import DepenseModal, { Depense } from './components/DepenseModal';
import { Input } from '@/components/ui/input';

export default function GestionDepensesPage() {
  const { toast } = useToast();
  const { user } = useContext(UserContext);
  const { params: siteParams } = useContext(ParamsContext);

  // États pour les filtres
  const [dateDebut, setDateDebut] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dateFin, setDateFin] = useState<Date>(new Date());
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchAgent, setSearchAgent] = useState<string>('');

  // États pour les données et le chargement
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [typesDepense, setTypesDepense] = useState<{ id: string; label: string }[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);

  // États pour les statistiques
  const [stats, setStats] = useState({
    totalDepenses: 0,
    montantTotal: 0
  });

  // États pour les modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);

  // Chargement des types de dépense
  useEffect(() => {
    const loadTypesDepense = async () => {
      setLoadingTypes(true);
      try {
        const query = `
          SELECT id_type, libelle 
          FROM type_variable 
          WHERE nom_variable = 'type_depense'
          ORDER BY libelle
        `;
        
        const response = await envoyerRequeteApi<{ id_type: number, libelle: string }[]>('boulangerie', query);
        
        if (response && Array.isArray(response)) {
          const formattedTypes = response.map(type => ({
            id: type.id_type.toString(),
            label: type.libelle
          }));
          setTypesDepense(formattedTypes);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des types de dépense:", error);
      } finally {
        setLoadingTypes(false);
      }
    };
    
    loadTypesDepense();
  }, []);

  // Chargement des dépenses
  const loadDepenses = useCallback(async () => {
    setIsLoading(true);
    try {
      // Construction des filtres
      const filters: string[] = [];
      
      if (dateDebut && dateFin) {
        filters.push(`date_op BETWEEN '${format(dateDebut, 'yyyy-MM-dd')}' AND '${format(dateFin, 'yyyy-MM-dd')}'`);
      }
      
      // Pour le caissier, limiter aux dépenses de son site
      filters.push(`id_site = ${user?.id_site || 0}`);
      
      if (selectedType) {
        filters.push(`id_type_depense = ${selectedType}`);
      }
      
      if (searchTerm.trim()) {
        filters.push(`description ILIKE '%${searchTerm.trim()}%'`);
      }
      
      if (searchAgent.trim()) {
        filters.push(`nom_agent ILIKE '%${searchAgent.trim()}%'`);
      }
      
      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
      
      const query = `
        SELECT 
          id_depense,
          id_site,
          id_boul,
          nom_site,
          date_op,
          id_type_depense,
          nom_type,
          description,
          montant,
          id_agent,
          nom_agent
        FROM list_depenses
        ${whereClause}
        ORDER BY date_op DESC, id_depense DESC
      `;
      
      console.log("Requête dépenses:", query);
      
      const response = await envoyerRequeteApi<Depense[]>('boulangerie', query);
      
      if (response && Array.isArray(response)) {
        setDepenses(response);
        
        // Calculer les statistiques
        const montantTotal = response.reduce((sum, d) => sum + d.montant, 0);
        
        setStats({
          totalDepenses: response.length,
          montantTotal
        });
        
        console.log("Dépenses chargées:", response.length);
      } else {
        setDepenses([]);
        setStats({
          totalDepenses: 0,
          montantTotal: 0
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des dépenses:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les dépenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateDebut, dateFin, selectedType, searchTerm, searchAgent, user?.id_site, toast]);

  // Charger les dépenses au départ et quand les filtres changent
  useEffect(() => {
    loadDepenses();
  }, [loadDepenses]);

  // Fonction pour appliquer les filtres manuellement
  const handleApplyFilters = () => {
    loadDepenses();
  };

  // Fonction pour réinitialiser les filtres
  const handleResetFilters = () => {
    const now = new Date();
    setDateDebut(new Date(now.getFullYear(), now.getMonth(), 1));
    setDateFin(new Date());
    setSelectedType('');
    setSearchTerm('');
    setSearchAgent('');
    loadDepenses();
  };

  // Fonction pour ouvrir le modal d'ajout
  const handleAddDepense = () => {
    setSelectedDepense(null);
    setShowAddModal(true);
  };

  // Fonction pour ouvrir le modal d'édition
  const handleEditDepense = (depense: Depense) => {
    setSelectedDepense(depense);
    setShowEditModal(true);
  };

  // Fonction pour ouvrir le dialog de suppression
  const handleDeleteClick = (depense: Depense) => {
    setSelectedDepense(depense);
    setShowDeleteDialog(true);
  };

  // Fonction pour supprimer une dépense
  const handleDeleteDepense = async () => {
    if (!selectedDepense) return;
    
    try {
      const query = `
        DELETE FROM depense 
        WHERE id_depense = ${selectedDepense.id_depense} 
        AND id_site = ${user?.id_site || 0}
        RETURNING 'OK' as result
      `;
      
      const response = await envoyerRequeteApi<{result: string}[]>('boulangerie', query);
      
      if (response && response.length > 0 && response[0].result === 'OK') {
        toast({
          title: "Succès",
          description: "La dépense a été supprimée avec succès",
        });
        
        loadDepenses();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la dépense",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedDepense(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* En-tête avec titre et bouton d'ajout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-red-700">Gestion des Dépenses</h1>
        <Button 
          onClick={handleAddDepense}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle dépense
        </Button>
      </div>

      {/* Zone de filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-red-800">Filtres</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Filtre date début */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date début:</label>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <input
                type="date"
                value={format(dateDebut, 'yyyy-MM-dd')}
                onChange={(e) => setDateDebut(new Date(e.target.value))}
                className="border text-gray-500 p-2 rounded text-sm focus:ring-red-500 focus:border-red-500 w-full"
              />
            </div>
          </div>
          
          {/* Filtre date fin */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date fin:</label>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <input
                type="date"
                value={format(dateFin, 'yyyy-MM-dd')}
                onChange={(e) => setDateFin(new Date(e.target.value))}
                className="border text-gray-500 p-2 rounded text-sm focus:ring-red-500 focus:border-red-500 w-full"
              />
            </div>
          </div>
          
          {/* Site (verrouillé pour le caissier) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Site:</label>
            <div className="flex items-center">
              <input
                type="text"
                value={siteParams?.sites?.find(site => site.id_site === user?.id_site)?.nom_site || ""}
                disabled
                className="border bg-gray-100 text-gray-700 p-2 rounded text-sm w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Type de dépense */}
          <div className="space-y-2">
            <SelectList
              label="Type de dépense"
              labelClassName="text-sm font-medium text-gray-700"
              items={typesDepense}
              value={selectedType}
              onChange={(value) => setSelectedType(value ? value.toString() : '')}
              placeholder="Tous les types"
              className="w-full"
              searchable={true}
            />
            {loadingTypes && (
    <p className="text-xs text-orange-500">Chargement des types de dépense...</p>
  )}
          </div>
          
          {/* Recherche par description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recherche par description:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher dans les descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 border border-gray-300 rounded-md w-full"
              />
            </div>
          </div>
          
          {/* Recherche par agent */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recherche par agent:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher un agent..."
                value={searchAgent}
                onChange={(e) => setSearchAgent(e.target.value)}
                className="pl-10 py-2 border border-gray-300 rounded-md w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-end space-x-2">
          <Button 
            onClick={handleApplyFilters}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              "Appliquer"
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResetFilters}
            className="border-red-500 text-red-600 hover:bg-red-50"
            disabled={isLoading}
          >
            Réinitialiser
          </Button>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Nombre de dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.totalDepenses}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Montant total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.montantTotal.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tableau des dépenses */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <ListFilter className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-700">Liste des dépenses</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
            <span className="ml-2 text-lg text-gray-600">Chargement des dépenses...</span>
          </div>
        ) : depenses.length > 0 ? (
          <div className="h-96 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="bg-gray-100">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depenses.map((depense) => (
                  <TableRow key={depense.id_depense} className="hover:bg-gray-50">
                    <TableCell className="whitespace-nowrap text-gray-700">
                      {format(new Date(depense.date_op), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-700">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        {depense.nom_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700 max-w-xs truncate">
                      <div className="flex items-center">
                        <Receipt className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                        <span className="line-clamp-1">{depense.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">
                      {depense.montant.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {depense.nom_agent}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDepense(depense)}
                          className="text-blue-600 hover:bg-blue-50 border-blue-200 h-8 w-8 p-0"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(depense)}
                          disabled={user?.libelle_profil === "Caissier" }
                          className="text-red-600 hover:bg-red-50 border-red-200 h-8 w-8 p-0"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Aucune dépense trouvée avec les critères sélectionnés.</p>
          </div>
        )}
      </div>
      
      {/* Modal d'ajout */}
      {showAddModal && (
        <DepenseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            loadDepenses();
            setShowAddModal(false);
          }}
          isEditing={false}
        />
      )}
      
      {/* Modal d'édition */}
      {showEditModal && selectedDepense && (
        <DepenseModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDepense(null);
          }}
          onSave={() => {
            loadDepenses();
            setShowEditModal(false);
            setSelectedDepense(null);
          }}
          depense={selectedDepense}
          isEditing={true}
        />
      )}
      
      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedDepense(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepense}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}