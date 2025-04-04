'use client';

import React, { useEffect, useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserContext } from '@/app/contexts/UserContext';
import { envoyerRequeteApi } from '@/app/apis/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Calendar, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VenteStats {
  totalVentes: number;
  totalMontant: number;
  ventesCurrentMonth: number;
  montantCurrentMonth: number;
  ventesMensuelles: {
    mois: string;
    nombreVentes: number;
    montantVentes: number;
  }[];
}

// Interfaces pour les réponses de l'API
interface TotalStatsResponse {
  total_ventes: string;
  total_montant: string;
}

interface VentesMensuellesResponse {
  mois: string;
  nombre_ventes: string;
  montant_ventes: string;
}

interface VenteMensuelle {
  mois: string;
  nombreVentes: number;
  montantVentes: number;
}

export default function CaissierDashboard() {
  const { user } = useContext(UserContext);
  const [stats, setStats] = useState<VenteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id_agent) {
        setError("Information utilisateur non disponible");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Date du mois courant
        const currentDate = new Date();
        const startMonth = startOfMonth(currentDate);
        const endMonth = endOfMonth(currentDate);
        const formattedStartMonth = format(startMonth, 'yyyy-MM-dd');
        const formattedEndMonth = format(endMonth, 'yyyy-MM-dd');
        
        // 1. Requête pour obtenir le total des ventes et le montant total
        const totalStatsQuery = `
          SELECT 
            COUNT(DISTINCT id_vente) as total_ventes, 
            SUM(total) as total_montant
          FROM list_ventes 
          WHERE id_agent = ${user.id_agent}
        `;
        
        // 2. Requête pour obtenir les ventes du mois en cours
        const currentMonthStatsQuery = `
          SELECT 
            COUNT(DISTINCT id_vente) as total_ventes, 
            SUM(total) as total_montant
          FROM list_ventes 
          WHERE id_agent = ${user.id_agent}
            AND date_op BETWEEN '${formattedStartMonth}' AND '${formattedEndMonth}'
        `;
        
        // 3. Requête pour obtenir les ventes mensuelles sur l'année
        const ventesParMoisQuery = `
          SELECT 
            TO_CHAR(date_op, 'MM-YY') as mois,
            COUNT(DISTINCT id_vente) as nombre_ventes,
            SUM(total) as montant_ventes
          FROM list_ventes 
          WHERE id_agent = ${user.id_agent}
            AND date_op >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY TO_CHAR(date_op, 'MM-YY')
          ORDER BY MIN(date_op)
        `;
        
        // Exécuter les requêtes
        const [totalStatsResponse, currentMonthStatsResponse, ventesParMoisResponse] = await Promise.all([
          envoyerRequeteApi<TotalStatsResponse[]>('boulangerie', totalStatsQuery),
          envoyerRequeteApi<TotalStatsResponse[]>('boulangerie', currentMonthStatsQuery),
          envoyerRequeteApi<VentesMensuellesResponse[]>('boulangerie', ventesParMoisQuery),
        ]);
        
        // Traiter les résultats
        const totalVentes = totalStatsResponse && totalStatsResponse[0] ? parseInt(totalStatsResponse[0].total_ventes) || 0 : 0;
        const totalMontant = totalStatsResponse && totalStatsResponse[0] ? parseFloat(totalStatsResponse[0].total_montant) || 0 : 0;
        
        const ventesCurrentMonth = currentMonthStatsResponse && currentMonthStatsResponse[0] ? parseInt(currentMonthStatsResponse[0].total_ventes) || 0 : 0;
        const montantCurrentMonth = currentMonthStatsResponse && currentMonthStatsResponse[0] ? parseFloat(currentMonthStatsResponse[0].total_montant) || 0 : 0;
        
        // Formater les données pour le graphique
        const rawVentesMensuelles = ventesParMoisResponse && Array.isArray(ventesParMoisResponse)
        ? ventesParMoisResponse.map(item => ({
            mois: item.mois,
            nombreVentes: parseInt(item.nombre_ventes) || 0,
            montantVentes: parseFloat(item.montant_ventes) || 0
          }))
        : [];
      
      // Générer les données pour tous les mois de l'année
      const generateMonthlyData = (ventesData: VenteMensuelle[]): VenteMensuelle[] => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // Créer un tableau pour tous les mois de l'année
        const allMonths = Array.from({ length: 12 }, (_, i) => {
          const monthNum = i + 1;
          const monthStr = String(monthNum).padStart(2, '0');
          const yearStr = String(currentYear).slice(2);
          return `${monthStr}-${yearStr}`;
        });
        
        // Créer un dictionnaire des données existantes
        const existingData: Record<string, VenteMensuelle> = {};
        ventesData.forEach(item => {
          existingData[item.mois] = item;
        });
        
        // Générer le tableau final avec tous les mois
        return allMonths.map(mois => {
          if (existingData[mois]) {
            return existingData[mois];
          } else {
            return {
              mois,
              nombreVentes: 0,
              montantVentes: 0
            };
          }
        });
      };
      
      const ventesMensuelles = generateMonthlyData(rawVentesMensuelles);
      
      setStats({
        totalVentes,
        totalMontant,
        ventesCurrentMonth,
        montantCurrentMonth,
        ventesMensuelles
      });
      } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err);
        setError("Impossible de charger les statistiques. Veuillez réessayer.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id_agent]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-red-600 animate-spin mr-2" />
        <span className="text-lg text-gray-600">Chargement des statistiques...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-red-700 mb-6">Tableau de Bord - {user?.nom_agent || 'Caissier'}</h1>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nombre total de ventes */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700 flex items-center">
              <ShoppingBag className="h-4 w-4 mr-2 text-blue-600" />
              Nombre total de ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats?.totalVentes.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        {/* Ventes du mois en cours */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-green-600" />
              Ventes du mois en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {stats?.ventesCurrentMonth.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(), 'MMMM yyyy', { locale: fr })}
            </p>
          </CardContent>
        </Card>
        
        {/* Montant total des ventes */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-red-600" />
              Montant total des ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {stats?.totalMontant.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>
        
        {/* Montant des ventes du mois */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-amber-600" />
              Montant du mois en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {stats?.montantCurrentMonth.toLocaleString()} FCFA
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(), 'MMMM yyyy', { locale: fr })}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Graphique des ventes mensuelles */}
      <Card className="bg-white">
  <CardHeader>
    <CardTitle className="text-lg font-medium text-gray-800">
      Évolution des ventes mensuelles
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={stats?.ventesMensuelles || []}
          margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
          barGap={2}
        >
          <defs>
            <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#e11d48" stopOpacity={0.3}/>
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
            domain={[0, (dataMax: number) => Math.max(4, dataMax)]} 
            allowDecimals={false}
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={{ stroke: '#E2E8F0' }}
            tickCount={5}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#FFF', 
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
            formatter={(value: number) => [`${value}`, 'Nombre de ventes']}
            labelFormatter={(label) => `Mois: ${label}`}
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
          />
          <Legend 
            wrapperStyle={{ bottom: 0, marginTop: '10px' }}
            formatter={(value) => <span style={{ color: '#666', fontSize: 12 }}>{value}</span>}
          />
          <Bar 
            dataKey="nombreVentes" 
            name="Nombre de ventes" 
            fill="url(#colorVentes)" 
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>
      
      {/* Table des ventes mensuelles */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">
            Détail des ventes mensuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Mois</th>
                  <th className="border p-2 text-center">Nombre de ventes</th>
                  <th className="border p-2 text-right">Montant total (FCFA)</th>
                </tr>
              </thead>
              <tbody>
                {stats?.ventesMensuelles.length ? (
                  stats.ventesMensuelles.map((mois, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border p-2 text-left">{mois.mois}</td>
                      <td className="border p-2 text-center">{mois.nombreVentes.toLocaleString()}</td>
                      <td className="border p-2 text-right">{mois.montantVentes.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="border p-2 text-center text-gray-500">
                      Aucune donnée de vente disponible
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100 font-medium">
                <tr>
                  <td className="border p-2 text-left">Total</td>
                  <td className="border p-2 text-center">{stats?.totalVentes.toLocaleString()}</td>
                  <td className="border p-2 text-right">{stats?.totalMontant.toLocaleString()} FCFA</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}