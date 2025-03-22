'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Type générique pour les éléments de liste
export type SelectItem = {
  id: string | number;
  label: string;
  [key: string]: unknown; // Utiliser unknown au lieu de any pour plus de sécurité
};

export interface SelectListProps<T extends SelectItem> {
  // Props de base
  label?: string;
  items: T[];
  value: string | number | null;
  onChange: (value: string | number | null, item?: T) => void;
  placeholder?: string;
  
  // Props d'apparence
  className?: string;
  labelClassName?: string;
  dropdownClassName?: string;
  itemClassName?: string;
  selectedItemClassName?: string;
  
  // Props de comportement
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  
  // Props de customisation
  searchPlaceholder?: string;
  noResultsText?: string;
  customSearchFilter?: (item: T, searchTerm: string) => boolean;
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
  idKey?: keyof T & string; // Clé à utiliser comme identifiant (doit être une chaîne)
  labelKey?: keyof T & string; // Clé à utiliser comme libellé (doit être une chaîne)
  
  // Props d'accessibilité
  ariaLabel?: string;
  name?: string;
  id?: string;
}

export function SelectList<T extends SelectItem>({
  label,
  items,
  value,
  onChange,
  placeholder = "Sélectionner...",
  className = "",
  labelClassName = "",
  dropdownClassName = "",
  itemClassName = "",
  selectedItemClassName = "",
  searchable = true,
  clearable = true,
  disabled = false,
  required = false,
  searchPlaceholder = "Rechercher...",
  noResultsText = "Aucun résultat",
  customSearchFilter,
  renderItem,
  idKey = "id" as keyof T & string,
  labelKey = "label" as keyof T & string,
  ariaLabel,
  name,
  id,
}: SelectListProps<T>) {
  // États
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      if (searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, searchable]);

  // Filtrer les éléments selon le terme de recherche
  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    
    if (customSearchFilter) {
      return customSearchFilter(item, searchTerm);
    }
    
    const itemLabel = String(item[labelKey]);
    return itemLabel.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case "Enter":
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
          selectItem(filteredItems[highlightedIndex]);
        } else {
          setIsOpen(!isOpen);
        }
        e.preventDefault();
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "ArrowDown":
        if (isOpen) {
          setHighlightedIndex((prev) => 
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
          e.preventDefault();
        } else {
          setIsOpen(true);
          e.preventDefault();
        }
        break;
      case "ArrowUp":
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          e.preventDefault();
        }
        break;
      case " ": // Espace
        if (!isOpen) {
          setIsOpen(true);
          e.preventDefault();
        }
        break;
    }
  };

  // Sélection d'un élément
  const selectItem = (item: T) => {
    // S'assurer que la valeur est du type attendu par onChange
    const value = item[idKey];
    // Vérifier que la valeur est du type attendu par onChange
    let safeValue: string | number | null = null;
    if (typeof value === 'string' || typeof value === 'number') {
      safeValue = value;
    }
    
    onChange(safeValue, item);
    setSearchTerm("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Effacer la sélection
  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm("");
  };

  // Trouver l'élément sélectionné
  const selectedItem = items.find((item) => String(item[idKey]) === String(value));
  
  // Défilement vers l'élément surligné
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <Label 
          htmlFor={id || name} 
          className={cn("block text-sm font-medium", labelClassName)}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div
        ref={containerRef}
        className="relative"
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || label}
        role="combobox"
        aria-controls={isOpen ? "select-dropdown" : undefined}
      >
        {/* Bouton principal */}
        <div 
          className={cn(
            "w-full border rounded-md p-2 flex justify-between items-center text-red-500",
            "transition-colors duration-200",
            disabled 
              ? "bg-gray-900 cursor-not-allowed opacity-70" 
              : "cursor-pointer hover:border-gray-400",
            isOpen 
              ? "border-red-500 ring-1 ring-red-500" 
              : "border-gray-300",
            selectedItem && selectedItemClassName
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          id={id || name}
        >
          <span className={cn(
            value ? "text-gray-900" : "text-gray-500"
          )}>
            {selectedItem 
              ? String(selectedItem[labelKey])
              : placeholder
            }
          </span>
          
          <div className="flex items-center">
            {value && clearable && (
              <button
                type="button"
                aria-label="Effacer la sélection"
                onClick={clearSelection}
                className="mr-1 p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                <X size={16} />
              </button>
            )}
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-gray-500 transition-transform duration-200",
                isOpen && "transform rotate-180"
              )} 
            />
          </div>
        </div>
        
        {/* Dropdown */}
        {isOpen && (
          <div 
            id="select-dropdown"
            className={cn(
              "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg",
              "overflow-hidden animate-in fade-in-0 zoom-in-95 ",
              "max-h-60",
              dropdownClassName
            )}
            ref={dropdownRef}
          >
            {/* Zone de recherche */}
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder={searchPlaceholder}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
            
            {/* Liste des éléments */}
            <ScrollArea className="max-h-48">
              {filteredItems.length > 0 ? (
                <div className="py-1">
                  {filteredItems.map((item, index) => (
                    <div
                      key={String(item[idKey])}
                      data-index={index}
                      className={cn(
                        "py-2 px-3 cursor-pointer flex items-center justify-between",
                        "transition-colors duration-100",
                        String(item[idKey]) === String(value)
                          ? "bg-red-50 text-red-700 font-medium"
                          : "hover:bg-gray-50 text-gray-900",
                        highlightedIndex === index && "bg-gray-100",
                        itemClassName
                      )}
                      onClick={() => selectItem(item)}
                      role="option"
                      aria-selected={String(item[idKey]) === String(value)}
                    >
                      {renderItem ? (
                        renderItem(item, String(item[idKey]) === String(value))
                      ) : (
                        <>
                          <span>{String(item[labelKey])}</span>
                          {String(item[idKey]) === String(value) && (
                            <Check className="h-4 w-4 text-red-600" />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-gray-500 text-sm">
                  {noResultsText}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectList;
