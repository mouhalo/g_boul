'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils'; // Assurez-vous d'avoir cette fonction d'utilitaire

interface StyleOptions {
  fontSize?: string;
  fontWeight?: string;
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  border?: string;
  borderBottom?: string;
}

interface DataTableStyles {
  table?: StyleOptions;
  header?: StyleOptions;
  headerRow?: StyleOptions;
  headerCell?: StyleOptions;
  body?: StyleOptions;
  row?: StyleOptions; 
  evenRow?: StyleOptions;
  oddRow?: StyleOptions;
  cell?: StyleOptions;
  selectedRow?: StyleOptions;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  styles?: DataTableStyles;
  className?: string;
  title?: string;
  titleClassName?: string;
  selectedId?: string | number;
  idField?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  styles = {},
  className,
  title,
  titleClassName,
  selectedId,
  idField,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Convertit les options de style en classes CSS
  const getStylesFromOptions = (options?: StyleOptions): string => {
    if (!options) return '';
    
    const classes = [];
    
    if (options.fontSize) classes.push(`text-[${options.fontSize}]`);
    if (options.fontWeight === 'bold') classes.push('font-bold');
    if (options.backgroundColor) classes.push(`bg-[${options.backgroundColor}]`);
    if (options.textColor) classes.push(`text-[${options.textColor}]`); // Assurez-vous que cela est correctement utilisé
    if (options.padding) classes.push(`p-[${options.padding}]`);
    if (options.border) classes.push(`border-[${options.border}]`);
    if (options.borderBottom) classes.push(`border-b-[${options.borderBottom}]`);
    
    return classes.join(' ');
  };

  // Styles pour le tableau entier
  const tableStyles = getStylesFromOptions(styles.table);
  
  // Styles pour l'en-tête
  const headerStyles = getStylesFromOptions(styles.header);
  const headerRowStyles = getStylesFromOptions(styles.headerRow);
  const headerCellStyles = getStylesFromOptions(styles.headerCell);
  
  // Styles pour le corps
  const bodyStyles = getStylesFromOptions(styles.body);
  const rowStyles = getStylesFromOptions(styles.row);
  const evenRowStyles = getStylesFromOptions(styles.evenRow);
  const oddRowStyles = getStylesFromOptions(styles.oddRow);
  const cellStyles = getStylesFromOptions(styles.cell);
  const selectedRowStyles = getStylesFromOptions(styles.selectedRow);

  // Vérifie si une ligne est sélectionnée
  const isRowSelected = (row: TData): boolean => {
    if (!selectedId || !idField) return false;
    return (row as Record<string, string | number>)[idField] === selectedId;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <div className={cn("p-4 font-medium", titleClassName, getStylesFromOptions(styles.header))}>
          {title}
        </div>
      )}
      <div className="rounded-md border">
        <Table className={tableStyles}>
          <TableHeader className={headerStyles}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow 
                key={headerGroup.id}
                className={headerRowStyles}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    className={headerCellStyles}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={bodyStyles}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => {
                const isSelected = idField ? isRowSelected(row.original) : row.getIsSelected();
                
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected && 'selected'}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      rowStyles,
                      index % 2 === 0 ? evenRowStyles : oddRowStyles,
                      isSelected ? selectedRowStyles : "",
                      onRowClick ? 'cursor-pointer hover:bg-muted' : ''
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cellStyles}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}