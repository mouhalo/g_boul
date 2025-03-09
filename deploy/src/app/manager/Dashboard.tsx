'use client';

import useLogin from '@/app/hooks/useLogin';

export default function Dashboard() {
  const { user } = useLogin();

  if (!user) {
    return <p>Utilisateur non connecté.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bienvenue, {user.nom_agent}!</h1>
      <p className="text-gray-600 mb-2">Profil: {user.libelle_profil}</p>
      <p className="text-gray-600">Boulangerie: {user.bakeryName}</p>
      
      {/* Statistiques et autres informations du tableau de bord à ajouter ici */}
    </div>
  );
}
