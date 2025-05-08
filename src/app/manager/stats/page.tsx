export default function StatistiquesPage() {
  // Date de création: 5 mai 2025
  const dateCreation = "05/05/2025";
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <div className="text-center max-w-md mx-auto p-8 bg-gray-50 border-2 border-red-500 rounded-b-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Statistiques</h1>
        <div className="text-red-600 text-6xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-red-600 mb-4">Page en construction</h2>
        <p className="text-gray-600 mb-6">
          Cette section permettra de visualiser les statistiques de vente et de production.
        </p>
        <div className="text-sm text-gray-500">
          Date de création: {dateCreation}
        </div>
      </div>
    </div>
  );
}
