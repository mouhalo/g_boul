'use client';
import React, { createContext, useContext, useState } from 'react';

type ToastVariant = 'default' | 'success' | 'destructive';

interface ToastProps {
  title?: string;
  description: string;
  variant?: ToastVariant;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([]);
  let toastId = 0;

  const toast = (props: ToastProps) => {
    const id = toastId++;
    setToasts((current) => [...current, { ...props, id }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3000);
  };

  const getVariantStyles = (variant: ToastVariant = 'default') => {
    switch (variant) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'destructive':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-800 text-white';
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(({ id, title, description, variant }) => (
          <div
            key={id}
            className={`${getVariantStyles(
              variant
            )} rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out`}
            style={{ minWidth: '300px' }}
          >
            {title && <h4 className="font-semibold mb-1">{title}</h4>}
            <p>{description}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
