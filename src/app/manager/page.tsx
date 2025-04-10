'use client';

import React, { useEffect, useState, useContext, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserContext } from '@/app/contexts/UserContext';
import { envoyerRequeteApi } from '@/app/apis/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SelectList } from '@/components/ui/select-list';
import {
  Loader2,
  Calendar,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Types et interfaces
interface VenteStats {
  totalVentes: number;
  totalMontant: number;
  ventesCurrentMonth: number;
  montantCurrentMonth: number;
  totalEncaisse: number;
  soldeRestant: number;
}

interface VenteMensuelle {
  mois: string;
  nombreVentes: number;
  montantVentes: number;
}

interface VenteParSite {
  id_site: number;
  nom_site: string;
  nombreVentes: number;
  montantVentes: number;
}

interface TopArticle {
  id_article: number;
  nom_article: string;
  quantite: number;
  montant: number;
}

interface TopClient {
  id_client: number;
  nom_client: string;
  montant: number;
}

interface RecapEncaissement {
  total_vente: number;
  total_encaisse: number;
  solde_restant: number;
}

interface DepenseParType {
  type_depense: string;
  periode: string;
  montant: number;
}

interface Site {
  id_site: number;
  code_site: string;
  nom_site: string;
  // Ajout des propriétés nécessaires pour SelectList
  id: number;
  label: string;
  [key: string]: unknown; // Index signature pour résoudre l'erreur TypeScript
}

// Interfaces pour les réponses de l'API
interface TotalStatsResponse {
  total_ventes: string;
  total_montant: string;
  total_encaisse: string;
  solde_restant: string;
}

interface VentesMensuellesResponse {
  mois: string;
  nombre_ventes: string;
  montant_ventes: string;
}

interface VentesParSiteResponse {
  id_site: string;
  nom_site: string;
  nombre_ventes: string;
  montant_ventes: string;
}

interface TopArticlesResponse {
  id_article: string;
  nom_article: string;
  quantite: string;
  montant: string;
}

interface TopClientsResponse {
  id_client: string;
  nom_client: string;
  montant: string;
}

interface RecapEncaissementResponse {
  total_vente: string;
  total_encaisse: string;
  solde_restant: string;
}

interface DepenseParTypeResponse {
  type_depense: string;
  periode: string;
  montant: string;
}

interface SiteResponse {
  id_site: string;
  code_site: string;
  nom_site: string;
}

export default function ManagerDashboard() {
  // Contexte utilisateur
  const { user } = useContext(UserContext);
  
  // États pour les filtres
  const [anneeSelectionnee, setAnneeSelectionnee] = useState<string | number>(new Date().getFullYear());
  const [siteSelectionne, setSiteSelectionne] = useState<string | number | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  
  // États pour les données
  const [stats, setStats] = useState<VenteStats | null>(null);
  const [ventesMensuelles, setVentesMensuelles] = useState<VenteMensuelle[]>([]);
  const [ventesParSite, setVentesParSite] = useState<VenteParSite[]>([]);
  const [topArticles, setTopArticles] = useState<TopArticle[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [recapEncaissement, setRecapEncaissement] = useState<RecapEncaissement | null>(null);
  const [depensesParType, setDepensesParType] = useState<DepenseParType[]>([]);
  
  // États pour le chargement et les erreurs
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Générer les années pour le filtre (4 dernières années)
  const annees = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => ({
      id: currentYear - i,
      label: (currentYear - i).toString()
    }));
  }, []);
  
  // Effet pour charger la liste des sites
  useEffect(() => {
    const fetchSites = async () => {
      if (!user?.id_agent) return;
      
      try {
        const sitesQuery = `
          SELECT id_site, code_site, nom_site
          FROM site
          ORDER BY nom_site
        `;
        
        const sitesResponse = await envoyerRequeteApi<SiteResponse[]>('boulangerie', sitesQuery);
        
        if (sitesResponse && sitesResponse.length > 0) {
          const sitesData = sitesResponse.map(site => ({
            id_site: parseInt(site.id_site),
            code_site: site.code_site,
            nom_site: site.nom_site,
            // Ajout des propriétés nécessaires pour SelectList
            id: parseInt(site.id_site),
            label: site.nom_site
          }));
          
          setSites([
            { id_site: 0, code_site: 'TOUS', nom_site: 'Tous les sites', id: 0, label: 'Tous les sites' },
            ...sitesData
          ]);
          
          // Si l'utilisateur est rattaché à un site spécifique et n'est pas manager
          if (user.id_site && user.libelle_profil !== 'Manager') {
            setSiteSelectionne(user.id_site);
          } else {
            setSiteSelectionne(0); // Tous les sites par défaut pour le manager
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sites:', error);
        setError('Impossible de charger la liste des sites');
      }
    };
    
    fetchSites();
  }, [user]);
  
  // Fonctions pour récupérer les données
  const fetchStats = async () => {
    // Construction de la condition de filtre pour le site
    const siteCondition = siteSelectionne && siteSelectionne !== 0 
      ? `AND id_site = ${siteSelectionne}` 
      : '';
    
    // Requête pour obtenir les statistiques globales
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT id_vente) as total_ventes, 
        SUM(total) as total_montant,
        SUM(mt_encaisse) as total_encaisse,
        SUM(total - mt_encaisse) as solde_restant
      FROM list_ventes 
      WHERE EXTRACT(YEAR FROM date_op) = ${anneeSelectionnee}
      ${siteCondition}
    `;
    
    // Requête pour obtenir les statistiques du mois en cours
    const currentDate = new Date();
    const startMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(currentDate);
    const formattedStartMonth = format(startMonth, 'yyyy-MM-dd');
    const formattedEndMonth = format(endMonth, 'yyyy-MM-dd');
    
    const currentMonthStatsQuery = `
      SELECT 
        COUNT(DISTINCT id_vente) as total_ventes, 
        SUM(total) as total_montant
      FROM list_ventes 
      WHERE date_op BETWEEN '${formattedStartMonth}' AND '${formattedEndMonth}'
      ${siteCondition}
    `;
    
    // Exécuter les requêtes
    const [statsResponse, currentMonthStatsResponse] = await Promise.all([
      envoyerRequeteApi<TotalStatsResponse[]>('boulangerie', statsQuery),
      envoyerRequeteApi<TotalStatsResponse[]>('boulangerie', currentMonthStatsQuery),
    ]);
    
    // Traiter les résultats
    const totalVentes = statsResponse && statsResponse[0] ? parseInt(statsResponse[0].total_ventes) || 0 : 0;
    const totalMontant = statsResponse && statsResponse[0] ? parseFloat(statsResponse[0].total_montant) || 0 : 0;
    const totalEncaisse = statsResponse && statsResponse[0] ? parseFloat(statsResponse[0].total_encaisse) || 0 : 0;
    const soldeRestant = statsResponse && statsResponse[0] ? parseFloat(statsResponse[0].solde_restant) || 0 : 0;
    
    const ventesCurrentMonth = currentMonthStatsResponse && currentMonthStatsResponse[0] ? parseInt(currentMonthStatsResponse[0].total_ventes) || 0 : 0;
    const montantCurrentMonth = currentMonthStatsResponse && currentMonthStatsResponse[0] ? parseFloat(currentMonthStatsResponse[0].total_montant) || 0 : 0;
    
    setStats({
      totalVentes,
      totalMontant,
      ventesCurrentMonth,
      montantCurrentMonth,
      totalEncaisse,
      soldeRestant
    });
  };
  
  const fetchVentesMensuelles = async () => {
    // Construction de la condition de filtre pour le site
    const siteCondition = siteSelectionne && siteSelectionne !== 0 
      ? `AND id_site = ${siteSelectionne}` 
      : '';
    
    // Requête pour obtenir les ventes mensuelles sur l'année
    const ventesParMoisQuery = `
      SELECT 
        TO_CHAR(date_op, 'MM-YY') as mois,
        COUNT(DISTINCT id_vente) as nombre_ventes,
        SUM(total) as montant_ventes
      FROM list_ventes 
      WHERE EXTRACT(YEAR FROM date_op) = ${anneeSelectionnee}
      ${siteCondition}
      GROUP BY TO_CHAR(date_op, 'MM-YY')
      ORDER BY MIN(date_op)
    `;
    
    const ventesParMoisResponse = await envoyerRequeteApi<VentesMensuellesResponse[]>('boulangerie', ventesParMoisQuery);
    
    if (ventesParMoisResponse && ventesParMoisResponse.length > 0) {
      const ventesData = ventesParMoisResponse.map(item => ({
        mois: item.mois,
        nombreVentes: parseInt(item.nombre_ventes) || 0,
        montantVentes: parseFloat(item.montant_ventes) || 0
      }));
      
      // Générer les données pour tous les mois de l'année
      const moisComplets = generateMonthlyData(ventesData);
      setVentesMensuelles(moisComplets);
    } else {
      setVentesMensuelles([]);
    }
  };
  
  const fetchVentesParSite = async () => {
    // Requête pour obtenir les ventes par site
    const ventesParSiteQuery = `
      SELECT 
        s.id_site,
        s.nom_site,
        COUNT(DISTINCT v.id_vente) as nombre_ventes,
        SUM(v.total) as montant_ventes
      FROM list_ventes v
      JOIN site s ON v.id_site = s.id_site
      WHERE EXTRACT(YEAR FROM v.date_op) = ${anneeSelectionnee}
      GROUP BY s.id_site, s.nom_site
      ORDER BY SUM(v.total) DESC
    `;
    
    const ventesParSiteResponse = await envoyerRequeteApi<VentesParSiteResponse[]>('boulangerie', ventesParSiteQuery);
    
    if (ventesParSiteResponse && ventesParSiteResponse.length > 0) {
      const ventesData = ventesParSiteResponse.map(item => ({
        id_site: parseInt(item.id_site),
        nom_site: item.nom_site,
        nombreVentes: parseInt(item.nombre_ventes) || 0,
        montantVentes: parseFloat(item.montant_ventes) || 0
      }));
      
      setVentesParSite(ventesData);
    } else {
      setVentesParSite([]);
    }
  };
  
  const fetchTopArticles = async () => {
    // Construction de la condition de filtre pour le site
    const siteCondition = siteSelectionne && siteSelectionne !== 0 
      ? `AND v.id_site = ${siteSelectionne}` 
      : '';
    
    // Requête pour obtenir le top 10 des articles
    const topArticlesQuery = `
      SELECT 
        v.id_article,
        v.nom_article,
        SUM(v.qte) as quantite,
        SUM(v.montant) as montant
      FROM list_ventes v
      WHERE EXTRACT(YEAR FROM v.date_op) = ${anneeSelectionnee}
      ${siteCondition}
      GROUP BY v.id_article, v.nom_article
      ORDER BY SUM(v.montant) DESC
      LIMIT 10
    `;
    
    const topArticlesResponse = await envoyerRequeteApi<TopArticlesResponse[]>('boulangerie', topArticlesQuery);
    
    if (topArticlesResponse && topArticlesResponse.length > 0) {
      const articlesData = topArticlesResponse.map(item => ({
        id_article: parseInt(item.id_article),
        nom_article: item.nom_article,
        quantite: parseInt(item.quantite) || 0,
        montant: parseFloat(item.montant) || 0
      }));
      
      setTopArticles(articlesData);
    } else {
      setTopArticles([]);
    }
  };
  
  const fetchTopClients = async () => {
    // Construction de la condition de filtre pour le site
    const siteCondition = siteSelectionne && siteSelectionne !== 0 
      ? `AND v.id_site = ${siteSelectionne}` 
      : '';
    
    // Requête pour obtenir le top 10 des clients
    const topClientsQuery = `
      SELECT 
        c.id_client,
        c.nom_client,
        SUM(v.total) as montant
      FROM list_ventes v
      JOIN client c ON v.id_client = c.id_client
      WHERE EXTRACT(YEAR FROM v.date_op) = ${anneeSelectionnee}
      ${siteCondition}
      GROUP BY c.id_client, c.nom_client
      ORDER BY SUM(v.total) DESC
      LIMIT 10
    `;
    
    const topClientsResponse = await envoyerRequeteApi<TopClientsResponse[]>('boulangerie', topClientsQuery);
    
    if (topClientsResponse && topClientsResponse.length > 0) {
      const clientsData = topClientsResponse.map(item => ({
        id_client: parseInt(item.id_client),
        nom_client: item.nom_client,
        montant: parseFloat(item.montant) || 0
      }));
      
      setTopClients(clientsData);
    } else {
      setTopClients([]);
    }
  };
  
  const fetchRecapEncaissement = async () => {
    // Construction de la condition de filtre pour le site
    const siteCondition = siteSelectionne && siteSelectionne !== 0 
      ? `AND id_site = ${siteSelectionne}` 
      : '';
    
    // Requête pour obtenir le récapitulatif des encaissements
    const recapQuery = `
      SELECT 
        SUM(total) as total_vente,
        SUM(montant_encaisse) as total_encaisse,
        SUM(total - montant_encaisse) as solde_restant
      FROM list_ventes 
      WHERE EXTRACT(YEAR FROM date_op) = ${anneeSelectionnee}
      ${siteCondition}
    `;
    
    const recapResponse = await envoyerRequeteApi<RecapEncaissementResponse[]>('boulangerie', recapQuery);
    
    if (recapResponse && recapResponse[0]) {
      setRecapEncaissement({
        total_vente: parseFloat(recapResponse[0].total_vente) || 0,
        total_encaisse: parseFloat(recapResponse[0].total_encaisse) || 0,
        solde_restant: parseFloat(recapResponse[0].solde_restant) || 0
      });
    } else {
      setRecapEncaissement(null);
    }
  };
  
  const fetchDepensesParType = async () => {
    // Construction de la condition de filtre pour le site
    const siteCondition = siteSelectionne && siteSelectionne !== 0 
      ? `AND id_site = ${siteSelectionne}` 
      : '';
    
    // Requête pour obtenir les dépenses par type et période
    const depensesQuery = `
      SELECT 
        nom_type as type_depense,
        periode,
        SUM(tot) as montant
      FROM gr_dep_types_periode
      WHERE SUBSTR(periode, 4, 4) = '${anneeSelectionnee}'
      ${siteCondition}
      GROUP BY nom_type, periode
      ORDER BY periode, SUM(tot) DESC
    `;
    
    const depensesResponse = await envoyerRequeteApi<DepenseParTypeResponse[]>('boulangerie', depensesQuery);
    
    if (depensesResponse && depensesResponse.length > 0) {
      const depensesData = depensesResponse.map(item => ({
        type_depense: item.type_depense,
        periode: item.periode,
        montant: parseFloat(item.montant) || 0
      }));
      
      setDepensesParType(depensesData);
    } else {
      setDepensesParType([]);
    }
  };
  
  // Générer les données pour tous les mois de l'année
  const generateMonthlyData = (ventesData: VenteMensuelle[]): VenteMensuelle[] => {
    const months = [
      '01-YY', '02-YY', '03-YY', '04-YY', '05-YY', '06-YY', 
      '07-YY', '08-YY', '09-YY', '10-YY', '11-YY', '12-YY'
    ];
    
    // Remplacer YY par l'année sélectionnée (format court)
    const yearSuffix = anneeSelectionnee.toString().slice(-2);
    const monthsWithYear = months.map(m => m.replace('YY', yearSuffix));
    
    // Créer un tableau avec tous les mois, avec des valeurs à 0 pour les mois sans données
    return monthsWithYear.map(mois => {
      const existingData = ventesData.find(v => v.mois === mois);
      if (existingData) {
        return existingData;
      }
      return {
        mois,
        nombreVentes: 0,
        montantVentes: 0
      };
    });
  };
  
  // Effet pour charger toutes les données lorsque les filtres changent
  useEffect(() => {
    if (!user?.id_agent || siteSelectionne === null) return;
    
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchStats(),
          fetchVentesMensuelles(),
          fetchVentesParSite(),
          fetchTopArticles(),
          fetchTopClients(),
          fetchRecapEncaissement(),
          fetchDepensesParType()
        ]);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anneeSelectionnee, siteSelectionne, user]);

  // Couleurs pour les graphiques
  const COLORS = [
    '#e11d48', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#d946ef'
  ];

  // Formatter pour les valeurs monétaires
  const formatMonetaire = (value: number) => `${value.toLocaleString()} FCFA`;

  // Formatter pour les pourcentages
  const formatPourcentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="p-4 space-y-6">
      {/* En-tête avec filtres */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-4 border-2 border-red-500 rounded-b-xl shadow-sm mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          Tableau de bord Manager
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="w-full sm:w-40">
            <SelectList
              label="Année"
              items={annees}
              value={anneeSelectionnee}
              onChange={(value) => setAnneeSelectionnee(value || new Date().getFullYear())}
              className="w-full"
            />
          </div>
          
          <div className="w-full sm:w-60">
            <SelectList
              label="Site"
              items={sites}
              value={siteSelectionne}
              onChange={(value) => setSiteSelectionne(value)}
              idKey="id"
              labelKey="label"
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <span className="ml-2 text-lg text-gray-600">Chargement des données...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cartes de statistiques - Ligne 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nombre total de ventes */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Nombre total de ventes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShoppingBag className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats?.totalVentes.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500">
                      Année {anneeSelectionnee}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Ventes du mois en cours */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Ventes du mois en cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats?.ventesCurrentMonth.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(), 'MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Montant total des ventes */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Montant total des ventes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats?.totalMontant.toLocaleString()} FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      Année {anneeSelectionnee}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Montant du mois en cours */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Montant du mois en cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats?.montantCurrentMonth.toLocaleString()} FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(), 'MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Cartes de statistiques - Ligne 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total encaissé */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total encaissé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-emerald-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats?.totalEncaisse.toLocaleString()} FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      {((stats?.totalEncaisse || 0) / (stats?.totalMontant || 1) * 100).toFixed(1)}% du montant total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Solde restant */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Solde restant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <RefreshCw className="h-8 w-8 text-amber-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats?.soldeRestant.toLocaleString()} FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      {((stats?.soldeRestant || 0) / (stats?.totalMontant || 1) * 100).toFixed(1)}% du montant total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Graphiques - Ligne 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique 1: Évolution des ventes par mois */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">
                  Évolution des ventes par mois
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={ventesMensuelles}
                    margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                  >
                    <defs>
                      <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorNombre" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="mois" 
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      padding={{ left: 10, right: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#FFF', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Montant des ventes') {
                          return [formatMonetaire(value), name];
                        }
                        return [value.toLocaleString(), name];
                      }}
                      labelFormatter={(label) => `Mois: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ bottom: 0, marginTop: '10px' }}
                      formatter={(value) => <span style={{ color: '#666', fontSize: 12 }}>{value}</span>}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="nombreVentes" 
                      name="Nombre de ventes" 
                      stroke="#0ea5e9" 
                      fillOpacity={1}
                      fill="url(#colorNombre)"
                      yAxisId="left"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="montantVentes" 
                      name="Montant des ventes" 
                      stroke="#e11d48" 
                      fillOpacity={1}
                      fill="url(#colorMontant)"
                      yAxisId="right"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Graphique 2: Ventes par site */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">
                  Ventes par site
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ventesParSite}
                    margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                    layout="vertical"
                    barGap={8}
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number"
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="nom_site" 
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#FFF', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Montant des ventes') {
                          return [formatMonetaire(value), name];
                        }
                        return [value.toLocaleString(), name];
                      }}
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    />
                    <Legend 
                      wrapperStyle={{ bottom: 0, marginTop: '10px' }}
                      formatter={(value) => <span style={{ color: '#666', fontSize: 12 }}>{value}</span>}
                    />
                    <Bar 
                      dataKey="nombreVentes" 
                      name="Nombre de ventes" 
                      fill="#0ea5e9" 
                      radius={[0, 4, 4, 0]}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="montantVentes" 
                      name="Montant des ventes" 
                      fill="#e11d48" 
                      radius={[0, 4, 4, 0]}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Graphiques - Ligne 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique 3: Top 10 articles les mieux vendus */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">
                  Top 10 articles les mieux vendus
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topArticles}
                    margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
                    layout="horizontal"
                    barGap={8}
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="nom_article"
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#FFF', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Montant') {
                          return [formatMonetaire(value), name];
                        }
                        return [value.toLocaleString(), name];
                      }}
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    />
                    <Legend 
                      wrapperStyle={{ bottom: 0, marginTop: '10px' }}
                      formatter={(value) => <span style={{ color: '#666', fontSize: 12 }}>{value}</span>}
                    />
                    <Bar 
                      dataKey="quantite" 
                      name="Quantité" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="montant" 
                      name="Montant" 
                      fill="#f59e0b" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Graphique 4: Top 10 meilleurs clients */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">
                  Top 10 meilleurs clients
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topClients}
                    margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                    layout="vertical"
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number"
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="nom_client" 
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      width={150}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#FFF', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number) => [formatMonetaire(value), 'Montant des achats']}
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    />
                    <Bar 
                      dataKey="montant" 
                      name="Montant des achats" 
                      fill="#8b5cf6" 
                      radius={[0, 4, 4, 0]}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      {topClients.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Graphiques - Ligne 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique 5: Récapitulatif encaissements */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">
                  Récapitulatif encaissements
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {recapEncaissement && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                      <Pie
                        data={[
                          { name: 'Encaissé', value: recapEncaissement.total_encaisse },
                          { name: 'Solde restant', value: recapEncaissement.solde_restant }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${formatPourcentage(percent * 100)}`}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#FFF', 
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: number) => [formatMonetaire(value), 'Montant']}
                      />
                      <Legend 
                        wrapperStyle={{ bottom: 0, marginTop: '10px' }}
                        formatter={(value) => <span style={{ color: '#666', fontSize: 12 }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {recapEncaissement && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Total ventes</p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatMonetaire(recapEncaissement.total_vente)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Taux d&apos;encaissement</p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatPourcentage((recapEncaissement.total_encaisse / recapEncaissement.total_vente) * 100)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Graphique 6: Dépenses par types et périodes */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">
                  Dépenses par types et périodes
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={depensesParType}
                    margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="periode" 
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis 
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#FFF', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number) => [formatMonetaire(value), 'Montant']}
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    />
                    <Legend 
                      wrapperStyle={{ bottom: 0, marginTop: '10px' }}
                      formatter={(value) => <span style={{ color: '#666', fontSize: 12 }}>{value}</span>}
                    />
                    <Bar 
                      dataKey="montant" 
                      name="Montant" 
                      fill="#ec4899" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      {depensesParType.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[entry.type_depense.charCodeAt(0) % COLORS.length]} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}