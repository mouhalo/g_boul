import { useState, useCallback } from 'react';

interface UsePaginationReturn<T> {
  items: T[];
  setItems: (items: T[]) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  setTotalItems: (total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setPageSize: (size: number) => void;
  totalPages: number;
  offset: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function useServerPagination<T>(
  initialPageSize: number = 10
): UsePaginationReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = Math.ceil(totalItems / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const limit = pageSize;
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  }, [totalPages]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    nextPage();
  }, [nextPage]);

  const goToPreviousPage = useCallback(() => {
    previousPage();
  }, [previousPage]);

  return {
    items,
    setItems,
    currentPage,
    pageSize,
    totalItems,
    setTotalItems,
    nextPage,
    previousPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
    totalPages,
    offset,
    limit,
    hasNextPage,
    hasPreviousPage,
  };
}
