'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { envoyerRequeteApi } from '@/app/apis/api';
import { useToast } from '@/components/ui/toast';
import { Loader2, FileText, CreditCard, X, TrendingUp, TrendingDown } from 'lucide-react';
import ExportButtons from '@/components/ExportButtons';
import { exportToPDF, exportToExcel, exportToCSV, ExportColumn } from '@/utils/exportUtils';
import { Button } from '@/components/ui/button';
import SelectList from '@/components/ui/select-list';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// Fonctions utilitaires pour le formatage et les styles
const getValueColor = (key: string, value: number | string): string => {
  if ((key === 'total_achats' || key === 'achats') && typeof value === 'number' && value > 0) return 'text-red-600 font-medium';
  if ((key === 'total_paiements' || key === 'paiements') && typeof value === 'number' && value > 0) return 'text-green-600 font-medium';
  if (['balance_periode', 'impact_solde'].includes(key) && typeof value === 'number') {
    if (value > 0) return 'text-red-600 font-medium';
    if (value < 0) return 'text-green-600 font-medium';
  }
  return '';
};

// Formater les valeurs selon leur type
const formatValue = (key: string, value: number | string): string => {
  if (['total_achats', 'total_paiements', 'balance_periode', 'achats', 'paiements', 'impact_solde'].includes(key) && typeof value === 'number') {
    return value > 0 ? `${value.toLocaleString()} FCFA` : 
           value < 0 ? `${value.toLocaleString()} FCFA` : '-';
  }
  return String(value);
};

// Styles CSS globaux pour la typographie
const globalStyles = `
  .modal-typography h1, .modal-typography h2, .modal-typography h3 {
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.025em;
  }
  
  .modal-typography .value {
    font-variant-numeric: tabular-nums;
  }
`;

interface Transaction {
  id_compte: number;
  id_client: number;
  nom_client: string;
  date_mouv: string;
  description: string;
  achats: number;
  paiements: number;
  impact_solde: number;
  id_site: number;
  nom_site: string;
}

interface Encaissement {
  mois: string;
  total_achats: number;
  total_paiements: number;
  balance_periode: number;
}

interface PeriodeOption {
  id: string;
  label: string;
  [key: string]: unknown; // Ajout d'une signature d'index pour compatibilité avec SelectItem
}

interface ClientEncaissementModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id_client: number;
    nom_client: string;
  };
  dateRange?: {
    dateDebut: Date;
    dateFin: Date;
  };
}

const ClientEncaissementModal: React.FC<ClientEncaissementModalProps> = ({
  isOpen,
  onClose,
  client,
  dateRange = {
    dateDebut: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1), // Par défaut: 3 mois en arrière
    dateFin: new Date()
  }
}) => {
  const { toast } = useToast();
  const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('tous');
  const [availablePeriods, setAvailablePeriods] = useState<PeriodeOption[]>([]);
  
  // États pour le modal des transactions
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [selectedEncaissement, setSelectedEncaissement] = useState<Encaissement | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Charger les encaissements
  const loadEncaissements = useCallback(async () => {
    if (!isOpen) return;
    
    setIsLoading(true);
    try {
      // Convertir les dates en format année-mois
      const startMonth = format(dateRange.dateDebut, 'yyyy-MM');
      const endMonth = format(dateRange.dateFin, 'yyyy-MM');
      
      let query = `
        SELECT * FROM vue_encaissements_par_periode
        WHERE id_client = ${client.id_client}
      `;
      
      if (selectedPeriod !== 'tous') {
        query += ` AND mois = '${selectedPeriod}'`;
      } else {
        query += ` AND mois BETWEEN '${startMonth}' AND '${endMonth}'`;
      }
      
      query += ` ORDER BY mois DESC`;
      
      const response = await envoyerRequeteApi<Encaissement[]>('boulangerie', query);
      
      if (response && Array.isArray(response)) {
        setEncaissements(response);
        
        // Si c'est le premier chargement, préparer les périodes disponibles
        if (availablePeriods.length <= 1) {
          const periods: PeriodeOption[] = [{ id: 'tous', label: 'Toutes les périodes' }];
          
          // Ajouter les périodes uniques
          const uniquePeriods = new Set<string>();
          response.forEach(enc => uniquePeriods.add(enc.mois));
          
          // Convertir les périodes en options pour le SelectList
          uniquePeriods.forEach(period => {
            const date = new Date(`${period}-01`);
            periods.push({
              id: period,
              label: format(date, 'MMMM yyyy', { locale: fr })
            });
          });
          
          setAvailablePeriods(periods);
        }
      } else {
        setEncaissements([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des encaissements:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les encaissements",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, client.id_client, selectedPeriod, toast, availablePeriods.length, dateRange.dateDebut, dateRange.dateFin]);

  // Charger les transactions pour un encaissement spécifique
  const loadTransactions = async (encaissement: Encaissement) => {
    setSelectedEncaissement(encaissement);
    setShowTransactionsModal(true);
    setIsLoadingTransactions(true);
    
    try {
      // Extraire le premier jour du mois
      const firstDayOfMonth = `${encaissement.mois}-01`;
      
      // Utiliser la fonction date_trunc de PostgreSQL pour calculer le dernier jour du mois
      const query = `
        SELECT * FROM vue_historique_transactions_client
        WHERE id_client = ${client.id_client}
        AND date_mouv BETWEEN '${firstDayOfMonth}' 
                         AND (date_trunc('month', '${firstDayOfMonth}'::date) + interval '1 month' - interval '1 day')
        ORDER BY date_mouv DESC
      `;
      
      const response = await envoyerRequeteApi<Transaction[]>('boulangerie', query);
      
      if (response && Array.isArray(response)) {
        setTransactions(response);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des transactions:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les transactions pour cette période",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Charger les encaissements à l'ouverture du modal
  useEffect(() => {
    if (isOpen) {
      loadEncaissements();
    }
  }, [isOpen, loadEncaissements]);

  // Calculer les totaux
  const totals = encaissements.reduce((acc, enc) => ({
    achats: acc.achats + enc.total_achats,
    paiements: acc.paiements + enc.total_paiements,
    balance: acc.balance + enc.balance_periode
  }), { achats: 0, paiements: 0, balance: 0 });
  
  // Fonctions d'export pour les encaissements
  const handleExportEncaissementsPDF = () => {
    // Définition des colonnes pour l'export
    const columns: ExportColumn[] = [
      { header: 'Période', key: 'periode', width: 40, align: 'left' },
      { header: 'Achats', key: 'total_achats', width: 40, align: 'right' },
      { header: 'Paiements', key: 'total_paiements', width: 40, align: 'right' },
      { header: 'Balance', key: 'balance_periode', width: 40, align: 'right' }
    ];
    
    // Préparation des données avec formatage des périodes
    const formattedData = encaissements.map(enc => ({
      ...enc,
      periode: format(new Date(`${enc.mois}-01`), 'MMMM yyyy', { locale: fr })
    }));
    
    // Résumé pour le PDF
    const summary = [
      { label: 'Total Achats', value: `${totals.achats.toLocaleString()} FCFA` },
      { label: 'Total Paiements', value: `${totals.paiements.toLocaleString()} FCFA` },
      { label: 'Balance Globale', value: `${totals.balance.toLocaleString()} FCFA` }
    ];
    
    // Export
    exportToPDF(
      formattedData,
      columns,
      `Encaissements_${client.nom_client.replace(/\s+/g, '_')}`,
      `Encaissements par période - ${client.nom_client}`,
      `Période sélectionnée: ${selectedPeriod === 'tous' ? 'Toutes les périodes' : format(new Date(`${selectedPeriod}-01`), 'MMMM yyyy', { locale: fr })}`,
      summary
    );
    
    toast({
      title: "Succès",
      description: "Les encaissements ont été exportés en PDF",
    });
  };

  const handleExportEncaissementsExcel = () => {
    // Définition des colonnes pour l'export
    const columns: ExportColumn[] = [
      { header: 'Période', key: 'periode', align: 'left' },
      { header: 'Achats', key: 'total_achats', align: 'right' },
      { header: 'Paiements', key: 'total_paiements', align: 'right' },
      { header: 'Balance', key: 'balance_periode', align: 'right' }
    ];
    
    // Préparation des données avec formatage des périodes
    const formattedData = encaissements.map(enc => ({
      ...enc,
      periode: format(new Date(`${enc.mois}-01`), 'MMMM yyyy', { locale: fr })
    }));
    
    // Export
    exportToExcel(
      formattedData,
      columns,
      `Encaissements_${client.nom_client.replace(/\s+/g, '_')}`,
      `Encaissements`
    );
    
    toast({
      title: "Succès",
      description: "Les encaissements ont été exportés en Excel",
    });
  };

  const handleExportEncaissementsCSV = () => {
    // Définition des colonnes pour l'export
    const columns: ExportColumn[] = [
      { header: 'Période', key: 'periode', align: 'left' },
      { header: 'Achats', key: 'total_achats', align: 'right' },
      { header: 'Paiements', key: 'total_paiements', align: 'right' },
      { header: 'Balance', key: 'balance_periode', align: 'right' }
    ];
    
    // Préparation des données avec formatage des périodes
    const formattedData = encaissements.map(enc => ({
      ...enc,
      periode: format(new Date(`${enc.mois}-01`), 'MMMM yyyy', { locale: fr })
    }));
    
    // Export
    exportToCSV(
      formattedData,
      columns,
      `Encaissements_${client.nom_client.replace(/\s+/g, '_')}`
    );
    
    toast({
      title: "Succès",
      description: "Les encaissements ont été exportés en CSV",
    });
  };
  
  // Fonctions d'export pour les transactions (modal imbriqué)
  const handleExportTransactionsPDF = () => {
    if (!selectedEncaissement) return;
    
    // Définition des colonnes pour l'export
    const columns: ExportColumn[] = [
      { header: 'Date', key: 'date_mouv', width: 30, align: 'left' },
      { header: 'Description', key: 'description', width: 70, align: 'left' },
      { header: 'Achats', key: 'achats', width: 30, align: 'right' },
      { header: 'Paiements', key: 'paiements', width: 30, align: 'right' },
      { header: 'Impact', key: 'impact_solde', width: 30, align: 'right' },
      { header: 'Site', key: 'nom_site', width: 30, align: 'left' }
    ];
    
    // Préparation des données avec formatage des dates
    const formattedData = transactions.map(transaction => ({
      ...transaction,
      date_mouv: format(new Date(transaction.date_mouv), 'dd/MM/yyyy', { locale: fr })
    }));
    
    // Résumé pour le PDF
    const summary = [
      { label: 'Total Achats', value: `${transactions.reduce((sum, t) => sum + t.achats, 0).toLocaleString()} FCFA` },
      { label: 'Total Paiements', value: `${transactions.reduce((sum, t) => sum + t.paiements, 0).toLocaleString()} FCFA` },
      { label: 'Impact sur Solde', value: `${selectedEncaissement.balance_periode.toLocaleString()} FCFA` }
    ];
    
    // Formatage de la période pour le titre
    const periode = format(new Date(`${selectedEncaissement.mois}-01`), 'MMMM yyyy', { locale: fr });
    
    // Export
    exportToPDF(
      formattedData,
      columns,
      `Transactions_${client.nom_client.replace(/\s+/g, '_')}_${selectedEncaissement.mois}`,
      `Transactions - ${client.nom_client}`,
      `Période: ${periode}`,
      summary
    );
    
    toast({
      title: "Succès",
      description: "Les transactions ont été exportées en PDF",
    });
  };

  const handleExportTransactionsExcel = () => {
    if (!selectedEncaissement) return;
    
    // Définition des colonnes pour l'export
    const columns: ExportColumn[] = [
      { header: 'Date', key: 'date_mouv', align: 'left' },
      { header: 'Description', key: 'description', align: 'left' },
      { header: 'Achats', key: 'achats', align: 'right' },
      { header: 'Paiements', key: 'paiements', align: 'right' },
      { header: 'Impact', key: 'impact_solde', align: 'right' },
      { header: 'Site', key: 'nom_site', align: 'left' }
    ];
    
    // Préparation des données avec formatage des dates
    const formattedData = transactions.map(transaction => ({
      ...transaction,
      date_mouv: format(new Date(transaction.date_mouv), 'dd/MM/yyyy', { locale: fr })
    }));
    
    // Formatage de la période pour le nom de fichier
    const periode = format(new Date(`${selectedEncaissement.mois}-01`), 'MMMM_yyyy', { locale: fr });
    
    // Export
    exportToExcel(
      formattedData,
      columns,
      `Transactions_${client.nom_client.replace(/\s+/g, '_')}_${periode}`,
      `Transactions`
    );
    
    toast({
      title: "Succès",
      description: "Les transactions ont été exportées en Excel",
    });
  };

  const handleExportTransactionsCSV = () => {
    if (!selectedEncaissement) return;
    
    // Définition des colonnes pour l'export
    const columns: ExportColumn[] = [
      { header: 'Date', key: 'date_mouv', align: 'left' },
      { header: 'Description', key: 'description', align: 'left' },
      { header: 'Achats', key: 'achats', align: 'right' },
      { header: 'Paiements', key: 'paiements', align: 'right' },
      { header: 'Impact', key: 'impact_solde', align: 'right' },
      { header: 'Site', key: 'nom_site', align: 'left' }
    ];
    
    // Préparation des données avec formatage des dates
    const formattedData = transactions.map(transaction => ({
      ...transaction,
      date_mouv: format(new Date(transaction.date_mouv), 'dd/MM/yyyy', { locale: fr })
    }));
    
    // Formatage de la période pour le nom de fichier
    const periode = format(new Date(`${selectedEncaissement.mois}-01`), 'MMMM_yyyy', { locale: fr });
    
    // Export
    exportToCSV(
      formattedData,
      columns,
      `Transactions_${client.nom_client.replace(/\s+/g, '_')}_${periode}`
    );
    
    toast({
      title: "Succès",
      description: "Les transactions ont été exportées en CSV",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <style>{globalStyles}</style>
        
        <DialogHeader className="flex flex-row justify-between items-center border-b pb-4 mb-4">
          <div>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Encaissements par période - {client.nom_client}
            </DialogTitle>
            <DialogDescription className="text-sm text-white mt-1">
              Suivi des encaissements et achats par période pour ce client
            </DialogDescription>
          </div>
          
          {/* Boutons d'export pour les encaissements */}
          {!isLoading && encaissements.length > 0 && (
            <ExportButtons
              onExportPDF={handleExportEncaissementsPDF}
              onExportExcel={handleExportEncaissementsExcel}
              onExportCSV={handleExportEncaissementsCSV}
              buttonVariant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            />
          )}
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
            <span className="ml-2 text-lg text-gray-600">Chargement des encaissements...</span>
          </div>
        ) : (
          <>
            {/* Résumé des totaux */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 modal-typography">
              <Card className="bg-white shadow-sm border-t-4 border-red-500 transition-all duration-200 hover:shadow-md">
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-sm font-medium text-gray-500">Total achats</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xl font-bold text-red-600 value cursor-help">{totals.achats.toLocaleString()} FCFA</p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Montant total des achats sur la période</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm border-t-4 border-green-500 transition-all duration-200 hover:shadow-md">
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-sm font-medium text-gray-500">Total paiements</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xl font-bold text-green-600 value cursor-help">{totals.paiements.toLocaleString()} FCFA</p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Montant total des paiements sur la période</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm border-t-4 border-blue-500 transition-all duration-200 hover:shadow-md">
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-sm font-medium text-gray-500">Balance globale</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center cursor-help">
                          <p className={`text-xl font-bold value ${totals.balance > 0 ? 'text-red-600' : totals.balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {totals.balance.toLocaleString()} FCFA
                          </p>
                          {totals.balance > 0 ? (
                            <TrendingUp className="h-4 w-4 ml-2 text-red-500" />
                          ) : totals.balance < 0 ? (
                            <TrendingDown className="h-4 w-4 ml-2 text-green-500" />
                          ) : null}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Différence entre achats et paiements</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </div>
            
            {/* Filtres */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex space-x-2">
                <SelectList
                  items={availablePeriods}
                  value={selectedPeriod}
                  onChange={(value) => setSelectedPeriod(value as string)}
                  placeholder="Sélectionner une période"
                  className="w-full md:w-64"
                />
                {selectedPeriod !== 'tous' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedPeriod('tous')}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>
            
            {/* Liste des encaissements */}
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-red-600 to-red-500 text-white">
                      <th className="p-3 text-left font-medium">Période</th>
                      <th className="p-3 text-right font-medium">Achats</th>
                      <th className="p-3 text-right font-medium">Paiements</th>
                      <th className="p-3 text-right font-medium">Balance</th>
                      <th className="p-3 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {encaissements.length > 0 ? (
                      encaissements.map((enc, index) => (
                        <tr key={index} className={`
                          border-b last:border-0 
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          hover:bg-blue-50 transition-colors duration-150
                        `}>
                          <td className="p-3">
                            {/* Utiliser format avec locale fr pour l'affichage de la période */}
                            <span className="font-medium text-gray-900">
                              {format(new Date(`${enc.mois}-01`), 'MMMM yyyy', { locale: fr })}
                            </span>
                          </td>
                          <td className={`p-3 text-right ${getValueColor('total_achats', enc.total_achats)}`}>
                            {formatValue('total_achats', enc.total_achats)}
                          </td>
                          <td className={`p-3 text-right ${getValueColor('total_paiements', enc.total_paiements)}`}>
                            {formatValue('total_paiements', enc.total_paiements)}
                          </td>
                          <td className={`p-3 text-right ${getValueColor('balance_periode', enc.balance_periode)}`}>
                            {formatValue('balance_periode', enc.balance_periode)}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadTransactions(enc)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium flex items-center px-3 py-1.5 rounded-md transition-colors"
                            >
                              <FileText className="h-4 w-4 mr-1.5" />
                              Transactions
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">
                          Aucun encaissement trouvé pour cette période
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        
        {/* Modal des transactions */}
        {selectedEncaissement && (
          <Dialog open={showTransactionsModal} onOpenChange={() => setShowTransactionsModal(false)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto animate-in fade-in-50 duration-300">
              <DialogHeader className="flex flex-row justify-between items-start border-b pb-4 mb-4">
                <div>
                  <DialogTitle className="text-xl font-bold text-red-600 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Transactions - {client.nom_client}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-white mt-1">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div>
                        <span className="font-medium">
                          {format(new Date(`${selectedEncaissement.mois}-01`), 'MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      <Badge variant="outline" className={`mt-2 md:mt-0 px-3 py-1 ${
                        selectedEncaissement.balance_periode > 0 ? 'bg-red-50 text-red-700 border-red-200' : 
                        selectedEncaissement.balance_periode < 0 ? 'bg-green-50 text-green-700 border-green-200' : 
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {selectedEncaissement.balance_periode > 0 ? 'Débiteur' : selectedEncaissement.balance_periode < 0 ? 'Créditeur' : 'Équilibré'}
                      </Badge>
                    </div>
                  </DialogDescription>
                </div>
                
                {/* Boutons d'export pour les transactions */}
                {!isLoadingTransactions && transactions.length > 0 && (
                  <ExportButtons
                    onExportPDF={handleExportTransactionsPDF}
                    onExportExcel={handleExportTransactionsExcel}
                    onExportCSV={handleExportTransactionsCSV}
                    buttonVariant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  />
                )}
              </DialogHeader>
              
              {isLoadingTransactions ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
                  <span className="ml-2 text-lg text-gray-600">Chargement des transactions...</span>
                </div>
              ) : (
                <>
                  {/* Résumé des transactions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 modal-typography">
                    <Card className="bg-white shadow-sm border-t-4 border-red-500 transition-all duration-200 hover:shadow-md">
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm font-medium text-gray-500">Total achats</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xl font-bold text-red-600 value cursor-help">
                                {transactions.reduce((sum, t) => sum + t.achats, 0).toLocaleString()} FCFA
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Montant total des achats sur la période</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white shadow-sm border-t-4 border-green-500 transition-all duration-200 hover:shadow-md">
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm font-medium text-gray-500">Total paiements</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xl font-bold text-green-600 value cursor-help">
                                {transactions.reduce((sum, t) => sum + t.paiements, 0).toLocaleString()} FCFA
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Montant total des paiements sur la période</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white shadow-sm border-t-4 border-blue-500 transition-all duration-200 hover:shadow-md">
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm font-medium text-gray-500">Impact sur solde</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center cursor-help">
                                <p className={`text-xl font-bold value ${
                                  selectedEncaissement.balance_periode > 0 ? 'text-red-600' : 
                                  selectedEncaissement.balance_periode < 0 ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {selectedEncaissement.balance_periode.toLocaleString()} FCFA
                                </p>
                                {selectedEncaissement.balance_periode > 0 ? (
                                  <TrendingUp className="h-4 w-4 ml-2 text-red-500" />
                                ) : selectedEncaissement.balance_periode < 0 ? (
                                  <TrendingDown className="h-4 w-4 ml-2 text-green-500" />
                                ) : null}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Impact des transactions sur le solde client</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Liste des transactions */}
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-red-600 to-red-500 text-white">
                            <th className="p-3 text-left font-medium">Date</th>
                            <th className="p-3 text-left font-medium">Description</th>
                            <th className="p-3 text-right font-medium">Achats</th>
                            <th className="p-3 text-right font-medium">Paiements</th>
                            <th className="p-3 text-right font-medium">Impact</th>
                            <th className="p-3 text-left font-medium">Site</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.length > 0 ? (
                            transactions.map((transaction) => (
                              <tr key={transaction.id_compte} className={`
                                border-b last:border-0 
                                ${Math.abs(transaction.impact_solde) > 50000 ? 'bg-amber-50' : 'bg-white'}
                                hover:bg-blue-50 transition-colors duration-150
                              `}>
                                <td className="p-3">
                                  <span className="font-medium text-black">
                                    {format(new Date(transaction.date_mouv), 'dd/MM/yyyy')}
                                  </span>
                                </td>
                                <td className="p-3 text-black">{transaction.description}</td>
                                <td className={`p-3 text-right ${getValueColor('achats', transaction.achats)}`}>
                                  {formatValue('achats', transaction.achats)}
                                </td>
                                <td className={`p-3 text-right ${getValueColor('paiements', transaction.paiements)}`}>
                                  {formatValue('paiements', transaction.paiements)}
                                </td>
                                <td className={`p-3 text-right ${getValueColor('impact_solde', transaction.impact_solde)}`}>
                                  {formatValue('impact_solde', transaction.impact_solde)}
                                </td>
                                <td className="p-3 text-blue-700">{transaction.nom_site}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-gray-500">
                                Aucune transaction trouvée pour cette période
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Version mobile pour les transactions (affichage en cartes) */}
                  <div className="md:hidden mt-4">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <div key={transaction.id_compte} className={`border-b p-3 last:border-0 mb-2 rounded-lg shadow-sm ${
                          Math.abs(transaction.impact_solde) > 50000 ? 'bg-amber-50' : ''
                        }`}>
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">
                              {format(new Date(transaction.date_mouv), 'dd/MM/yyyy')}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={transaction.impact_solde > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}
                            >
                              {transaction.impact_solde.toLocaleString()} FCFA
                            </Badge>
                          </div>
                          <div className="text-sm mb-2">{transaction.description}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500">Achats:</div>
                            <div className="text-right text-red-600 font-medium">
                              {transaction.achats > 0 ? transaction.achats.toLocaleString() + ' FCFA' : '-'}
                            </div>
                            <div className="text-gray-500">Paiements:</div>
                            <div className="text-right text-green-600 font-medium">
                              {transaction.paiements > 0 ? transaction.paiements.toLocaleString() + ' FCFA' : '-'}
                            </div>
                            <div className="text-gray-500">Site:</div>
                            <div className="text-right">{transaction.nom_site}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                        Aucune transaction trouvée pour cette période
                      </div>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientEncaissementModal;
