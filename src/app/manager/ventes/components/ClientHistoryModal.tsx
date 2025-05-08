'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { envoyerRequeteApi } from '@/app/apis/api';
import { useToast } from '@/components/ui/toast';
import { Loader2, FileText } from 'lucide-react';
import ExportButtons from '@/components/ExportButtons';
import { exportToPDF, exportToExcel, exportToCSV, ExportColumn } from '@/utils/exportUtils';

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

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id_client: number;
    nom_client: string;
  };
  dateRange: {
    dateDebut: Date;
    dateFin: Date;
  };
}

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  isOpen,
  onClose,
  client,
  dateRange
}) => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const query = `
          SELECT * FROM vue_historique_transactions_client
          WHERE id_client = ${client.id_client}
          AND date_mouv BETWEEN '${format(dateRange.dateDebut, 'yyyy-MM-dd')}' AND '${format(dateRange.dateFin, 'yyyy-MM-dd')}'
          ORDER BY date_mouv DESC
        `;
        
        const response = await envoyerRequeteApi<Transaction[]>('boulangerie', query);
        
        if (response && Array.isArray(response)) {
          setTransactions(response);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'historique des transactions:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger l&apos;historique des transactions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTransactions();
  }, [isOpen, client.id_client, dateRange.dateDebut, dateRange.dateFin, toast]);

  // Calcul des totaux
  const totals = transactions.reduce((acc, transaction) => ({
    achats: acc.achats + transaction.achats,
    paiements: acc.paiements + transaction.paiements,
    impact: acc.impact + transaction.impact_solde
  }), { achats: 0, paiements: 0, impact: 0 });
  
  // Fonctions d'export pour l'historique des transactions
  const handleExportPDF = () => {
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
      { label: 'Total Achats', value: `${totals.achats.toLocaleString()} FCFA` },
      { label: 'Total Paiements', value: `${totals.paiements.toLocaleString()} FCFA` },
      { label: 'Impact sur Solde', value: `${totals.impact.toLocaleString()} FCFA` }
    ];
    
    // Période pour le sous-titre
    const periodeDebut = format(dateRange.dateDebut, 'dd/MM/yyyy', { locale: fr });
    const periodeFin = format(dateRange.dateFin, 'dd/MM/yyyy', { locale: fr });
    
    // Export
    exportToPDF(
      formattedData,
      columns,
      `Historique_Transactions_${client.nom_client.replace(/\s+/g, '_')}`,
      `Historique des Transactions - ${client.nom_client}`,
      `Période du ${periodeDebut} au ${periodeFin}`,
      summary
    );
    
    toast({
      title: "Succès",
      description: "L'historique des transactions a été exporté en PDF",
    });
  };

  const handleExportExcel = () => {
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
    
    // Export
    exportToExcel(
      formattedData,
      columns,
      `Historique_Transactions_${client.nom_client.replace(/\s+/g, '_')}`,
      `Transactions`
    );
    
    toast({
      title: "Succès",
      description: "L'historique des transactions a été exporté en Excel",
    });
  };

  const handleExportCSV = () => {
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
    
    // Export
    exportToCSV(
      formattedData,
      columns,
      `Historique_Transactions_${client.nom_client.replace(/\s+/g, '_')}`
    );
    
    toast({
      title: "Succès",
      description: "L'historique des transactions a été exporté en CSV",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between items-center border-b pb-4 mb-4">
          <div>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Historique des transactions - {client.nom_client}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {format(dateRange.dateDebut, 'dd/MM/yyyy', { locale: fr })} au {format(dateRange.dateFin, 'dd/MM/yyyy', { locale: fr })}
            </p>
          </div>
          
          {/* Boutons d'export */}
          {!isLoading && transactions.length > 0 && (
            <ExportButtons
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
              buttonVariant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            />
          )}
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
            <span className="ml-2 text-lg text-gray-600">Chargement de lhistorique...</span>
          </div>
        ) : (
          <>
            {/* Résumé */}
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Total achats</div>
                  <div className="text-lg font-bold text-red-600">{totals.achats.toLocaleString()} FCFA</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total paiements</div>
                  <div className="text-lg font-bold text-green-600">{totals.paiements.toLocaleString()} FCFA</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Impact sur solde</div>
                  <div className={`text-lg font-bold ${totals.impact > 0 ? 'text-red-600' : totals.impact < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {totals.impact.toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tableau des transactions */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-red-500 text-white">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-right">Achats</th>
                    <th className="p-2 text-right">Paiements</th>
                    <th className="p-2 text-right">Impact</th>
                    <th className="p-2 text-left">Site</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <tr key={transaction.id_compte} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          {format(new Date(transaction.date_mouv), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="p-2">{transaction.description}</td>
                        <td className="p-2 text-right text-red-600 bg-red-100">
                          {transaction.achats > 0 ? transaction.achats.toLocaleString() : '-'}
                        </td>
                        <td className="p-2 text-right text-green-600 bg-green-100">
                          {transaction.paiements > 0 ? transaction.paiements.toLocaleString() : '-'}
                        </td>
                        <td className={`p-2 text-right ${transaction.impact_solde > 0 ? 'text-red-600 bg-white' : transaction.impact_solde < 0 ? 'text-green-600 bg-green-100' : ''}`}>
                          {transaction.impact_solde.toLocaleString()}
                        </td>
                        <td className="p-2">{transaction.nom_site}</td>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientHistoryModal;