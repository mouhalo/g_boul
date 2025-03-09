// src/components/user/PasswordResetModal.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { envoyerRequeteApi } from '@/app/apis/api';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  idSite: number;
  idAgent: number;
}

export default function PasswordResetModal({ isOpen, onClose, idSite, idAgent }: PasswordResetModalProps) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setLoading(true);
    try {
      const query = `SELECT * FROM maj_password(${idSite}, ${idAgent}, '${formData.oldPassword}', '${formData.newPassword}')`;
      const response = await envoyerRequeteApi<{ maj_password: string }[]>('boulangerie', query);
      
      if (response?.[0]?.maj_password === 'OK') {
        onClose();
      } else {
        setError('Échec de la mise à jour du mot de passe');
      }
    } catch {
      setError('Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  const inputTextStyle = "text-[#905d05]";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6"
      >
        <h3 className={`text-lg font-bold mb-4 ${inputTextStyle}`}>Réinitialisation du mot de passe</h3>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Ancien mot de passe"
              value={formData.oldPassword}
              onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
              className={`w-full p-2 border rounded ${inputTextStyle}`}
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className={`w-full p-2 border rounded ${inputTextStyle}`}
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={`w-full p-2 border rounded ${inputTextStyle}`}
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'En cours...' : 'Valider'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
