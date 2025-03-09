import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

export interface Recette {
  id_boul: number;
  id_site: number;
  id_recette: number;
  nom_recette: string;
  id_article: number;
  nom_article: string;
  nom_type: string;
  qte_prod: number;
  temps_cuisson: number;
  actif: boolean;
  nom_site: string;
}

export const columns: ColumnDef<Recette>[] = [
  {
    accessorKey: "nom_recette",
    header: "Nom de la recette",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("nom_recette")}</div>
    ),
  },
  {
    accessorKey: "nom_article",
    header: "Article",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("nom_article")}</div>
    ),
  },
  {
    accessorKey: "nom_type",
    header: "Type",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("nom_type")}</div>
    ),
  },
  {
    accessorKey: "qte_prod",
    header: "Quantité",
    cell: ({ row }) => (
      <div className="text-right">{row.getValue("qte_prod")}</div>
    ),
  },
  {
    accessorKey: "temps_cuisson",
    header: "Temps de cuisson",
    cell: ({ row }) => (
      <div className="text-right">{row.getValue("temps_cuisson")} min</div>
    ),
  },
  {
    accessorKey: "nom_site",
    header: "Site",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("nom_site")}</div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const recette = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              console.log("Edit recette:", recette.id_recette);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              console.log("Delete recette:", recette.id_recette);
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
