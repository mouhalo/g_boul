'use client';

import { Button } from "@/components/ui/button";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onFirstPage: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
  children?: ReactNode;
}

export function CustomPagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
  children
}: CustomPaginationProps) {
  return (
    <div className="mt-4 flex justify-between items-center">
      <div className="text-sm text-gray-700">
        Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
        <span className="font-medium">
          {Math.min(endIndex + 1, totalItems)}
        </span>{' '}
        sur <span className="font-medium">{totalItems}</span> éléments
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onFirstPage}
          disabled={currentPage === 1}
          className="h-8 w-8"
        >
          <ChevronFirst className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onPreviousPage}
          disabled={currentPage === 1}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="mx-2">
          Page {currentPage} sur {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onLastPage}
          disabled={currentPage === totalPages}
          className="h-8 w-8"
        >
          <ChevronLast className="h-4 w-4" />
        </Button>
        {children}
      </div>
    </div>
  );
}
