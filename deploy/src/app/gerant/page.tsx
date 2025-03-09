'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from "../../components/shared/StatsCard";

export default function GerantPage() {
  const [salesData] = useState([
    { day: 'Lun', amount: 150000 },
    { day: 'Mar', amount: 200000 },
    { day: 'Mer', amount: 180000 },
    { day: 'Jeu', amount: 220000 },
    { day: 'Ven', amount: 250000 },
    { day: 'Sam', amount: 300000 },
    { day: 'Dim', amount: 190000 },
  ]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard 
          title="Ventes du jour" 
          value="250.000 XOF" 
        />
        <StatsCard 
          title="Stock critique" 
          value="3 produits" 
        />
        <StatsCard 
          title="Commandes en attente" 
          value="5" 
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Évolution des ventes</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#DC2626" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}