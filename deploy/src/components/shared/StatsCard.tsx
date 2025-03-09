// src/components/shared/StatsCard.tsx
'use client';
import { motion } from 'framer-motion';

export default function StatsCard({ title, value }: { title: string; value: string }) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white p-6 rounded-lg shadow-sm"
      >
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
      </motion.div>
    );
   }