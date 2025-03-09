'use client';

import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/app/contexts/UserContext';
import PasswordResetModal from './PasswordResetModal';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [formData, setFormData] = useState({
    id_agent: user?.id_agent || 0,
    id_site: user?.id_site || 0,
    id_type_agent: user?.id_type_agent || 1,
    nom_agent: user?.nom_agent || '',
    tel_agent: user?.tel_agent || '',
    login_agent: user?.login_agent || '',
    agent_actif: user?.agent_actif ?? true,
    email: user?.email || ''
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Implémenter la mise à jour
      onClose();
    } catch (err) {
      console.error('❌ Erreur lors de la connexion:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    setShowPasswordReset(true);
  };

  const inputTextStyle = "text-[#7e630c]";

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="relative min-h-screen flex items-center justify-center p-4"
            >
              <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="bg-red-600 text-white py-4 px-6 rounded-t-lg">
                  <h2 className="text-xl font-semibold text-center">
                    MODIFICATION DU COMPTE DE L&apos;UTILISATEUR
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-white hover:bg-red-700 rounded-full p-1"
                >
                  <X size={20} />
                </button>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={formData.nom_agent}
                      onChange={(e) => setFormData({ ...formData, nom_agent: e.target.value })}
                      className={`w-full p-2 border rounded bg-lime-200 ${inputTextStyle}`}
                      placeholder="Nom complet"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.tel_agent}
                      onChange={(e) => setFormData({ ...formData, tel_agent: e.target.value })}
                      className={`w-full p-2 border rounded bg-lime-200 ${inputTextStyle}`}
                      placeholder="Téléphone"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full p-2 border rounded bg-lime-200 ${inputTextStyle}`}
                      placeholder="Email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site
                    </label>
                    <select
                      value={formData.id_site}
                      onChange={(e) => setFormData({ ...formData, id_site: Number(e.target.value) })}
                      className={`w-full p-2 border rounded ${inputTextStyle}`}
                    >
                      {user?.sites?.map(site => (
                        <option key={site.id_site} value={site.id_site}>
                          {site.nom_site}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de compte
                    </label>
                    <select
                      value={formData.id_type_agent}
                      onChange={(e) => setFormData({ ...formData, id_type_agent: Number(e.target.value) })}
                      className={`w-full p-2 border rounded ${inputTextStyle}`}
                      disabled
                    >
                      <option value={1}>Manager</option>
                      <option value={2}>Gérant</option>
                      <option value={3}>Comptable</option>
                      <option value={4}>Caissier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Login
                    </label>
                    <input
                      type="text"
                      value={formData.login_agent}
                      className={`w-full p-2 border rounded ${inputTextStyle}`}
                      placeholder="Login"
                      readOnly
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value="************"
                      className={`w-full p-2 border rounded bg-red-100 ${inputTextStyle}`}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="absolute right-2 top-8 text-red-600 hover:text-red-800"
                    >
                      <Lock size={20} />
                    </button>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.agent_actif}
                      onChange={(e) => setFormData({ ...formData, agent_actif: e.target.checked })}
                      className="mr-2"
                      id="blockAccount"
                      disabled
                    />
                    <label 
                      className={`text-gray-600 ${formData.agent_actif ? 'text-green-600' : 'text-red-600'}`}
                      htmlFor="blockAccount"
                    >
                      {formData.agent_actif ? 'Compte actif' : 'Compte inactif'}
                    </label>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-500 text-white px-6 py-2 rounded flex items-center space-x-2 hover:bg-green-600 disabled:opacity-50"
                    >
                      <span>Enregistrer</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-400"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showPasswordReset && (
        <PasswordResetModal
          isOpen={showPasswordReset}
          onClose={() => setShowPasswordReset(false)}
          idAgent={formData.id_agent}
          idSite={formData.id_site}
        />
      )}
    </>
  );
}
