'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CmsRouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
}

const CmsRouterContext = createContext<CmsRouterContextType | undefined>(undefined);

export function CmsRouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>('/cms');

  const navigate = (path: string) => {
    setCurrentPath(path);
  };

  return (
    <CmsRouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </CmsRouterContext.Provider>
  );
}

export function useCmsRouter() {
  const context = useContext(CmsRouterContext);
  if (context === undefined) {
    throw new Error('useCmsRouter must be used within a CmsRouterProvider');
  }
  return context;
}

export function CmsLink({ to, children, className }: { to: string, children: ReactNode, className?: string }) {
  const { navigate } = useCmsRouter();
  return (
    <a 
      href="#" 
      className={className} 
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
