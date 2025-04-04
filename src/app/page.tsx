'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { QrCode, User, Lock, ChevronRight } from 'lucide-react';
import useLogin from './hooks/useLogin';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { APP_VERSION } from './constants/version';

const inputVariants = {
  focus: {
    scale: 1.02,
    boxShadow: '0 0 0 2px rgba(132, 204, 22, 0.5)',
    transition: { duration: 0.2 },
  },
};

export default function Home() {
  const { handleLogin, loading, error } = useLogin();
  const [formData, setFormData] = useState({
    code_boulangerie: '',
    login: '',
    password: ''
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Charger les données depuis localStorage au chargement de la page
  useEffect(() => {
    const savedData = localStorage.getItem('bakeryLoginData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        setRememberMe(true);
      } catch (e) {
        console.error('Erreur lors de la lecture des données sauvegardées:', e);
      }
    }
  }, []);

  useEffect(() => {
    console.log('Initial Form Data:', formData);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Code Boulangerie:', formData.code_boulangerie);
    
    // Sauvegarder dans localStorage si rememberMe est activé
    if (rememberMe) {
      localStorage.setItem('bakeryLoginData', JSON.stringify(formData));
    } else {
      // Supprimer les données si l'utilisateur ne veut pas les sauvegarder
      localStorage.removeItem('bakeryLoginData');
    }
    
    handleLogin(formData);
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  const clearSavedData = () => {
    localStorage.removeItem('bakeryLoginData');
    setFormData({
      code_boulangerie: '',
      login: '',
      password: ''
    });
    setRememberMe(false);
  };

  return (
    <>
      <LoadingSpinner isOpen={loading} />
      <div className="min-h-screen flex flex-col bg-[#FFF8DC]">
        <header className="bg-red-600 text-white p-4 text-center shadow-lg">
          <h1 className="text-xl font-bold">Les Délices de Donaye</h1>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 pointer-events-none">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <path 
                d="M0,50 Q50,0 100,50 Q50,100 0,50" 
                fill="#CD853F" 
                opacity="0.1"
              />
            </svg>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-1/2 p-8"
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-red-600">Solution de gestion</span>
              <br />
              <span className="text-[#CD853F]">de votre boulangerie</span>
            </h2>
            <p className="text-gray-600 mb-8">
              Gérez efficacement vos stocks, ventes et dépenses
            </p>

            <div className="space-y-6">
              {['Gestion des stocks en temps réel', 'Suivi des ventes quotidiennes', 'Rapports détaillés'].map(
                (text, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <div className="w-4 h-4 rounded-full bg-red-600 shadow-md" />
                    <span className="text-gray-700 font-medium">{text}</span>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-1/2 p-8 flex items-center justify-center"
          >
            <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-xl">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <Image
                  src="/images/logo.png"
                  alt="G_Boul Logo"
                  fill
                  className="object-contain animate-pulse"
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {['code_boulangerie', 'login', 'password'].map((field) => (
                  <motion.div
                    key={field}
                    variants={inputVariants}
                    animate={focusedField === field ? 'focus' : undefined}
                    className="relative"
                  >
                    {field === 'code_boulangerie' && <QrCode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />}
                    {field === 'login' && <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />}
                    {field === 'password' && <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />}
                    
                    <input
                      type={field === 'password' ? 'password' : 'text'}
                      placeholder={`Taper votre ${field === 'code_boulangerie' ? 'code_boulangerie' : field}`}
                      value={formData[field as keyof typeof formData] ?? ''}
                      onChange={(e) =>
                        setFormData({ 
                          ...formData, 
                          [field]: field === 'code_boulangerie' ? e.target.value.toUpperCase() : e.target.value 
                        })
                      }
                      onFocus={() => setFocusedField(field)}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 rounded-full border-2 border-red-600 focus:outline-none focus:border-lime-500 text-[#FF0000] bg-white"
                      required
                      disabled={loading}
                    />
                  </motion.div>
                ))}

                {/* Option Se souvenir de moi */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={toggleRememberMe}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <label htmlFor="rememberMe" className="text-sm text-gray-700">
                      Se souvenir de moi
                    </label>
                  </div>
                  
                  {rememberMe && localStorage.getItem('bakeryLoginData') && (
                    <button
                      type="button"
                      onClick={clearSavedData}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Effacer mes données
                    </button>
                  )}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center py-3 px-6 rounded-full 
                    ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} 
                    text-white font-bold shadow-lg transition-all`}
                >
                  <span>{loading ? 'Connexion...' : 'Entrer'}</span>
                  {!loading && <ChevronRight size={20} className="ml-2" />}
                </motion.button>
                
                {/* Copyright et version */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} Les Délices de Donaye. Tous droits réservés.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Version {APP_VERSION}
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}