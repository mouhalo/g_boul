'use client';

import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface PageConstructionProps {
  title: string;
  message: string;
  icon?: ReactNode;
  buttonText?: string;
  buttonAction?: () => void;
}

const PageConstruction: React.FC<PageConstructionProps> = ({
  title,
  message,
  icon,
  buttonText,
  buttonAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
      <div className="mb-6">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {buttonText && buttonAction && (
        <Button 
          onClick={buttonAction} 
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default PageConstruction;