export default function RecettesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#7e630c]">Gestion des Recettes</h2>
          <p className="text-muted-foreground">
            Gérez vos recettes et leurs ingrédients
          </p>
        </div>
      </div>
      <div className="flex-1 space-y-4">{children}</div>
    </div>
  );
}
