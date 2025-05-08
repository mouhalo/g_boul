'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  FileSpreadsheet, 
  FileDown,
  Download,
  ChevronDown
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface ExportButtonsProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  className?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportPDF,
  onExportExcel,
  onExportCSV,
  className = "",
  buttonVariant = "outline"
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size="sm" 
          className={`flex items-center ${className}`}
        >
          <Download className="h-4 w-4 mr-1" />
          Exporter
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          <span>Exporter en PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportExcel} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          <span>Exporter en Excel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
          <FileDown className="h-4 w-4 mr-2" />
          <span>Exporter en CSV</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;
