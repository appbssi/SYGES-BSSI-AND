
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';

interface LogoContextType {
  logo: ReactNode;
  setLogoUrl: (url: string | null) => void;
  isDefaultLogo: boolean;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

const DefaultLogo = () => <Shield className="h-16 w-16" />;

export const LogoProvider = ({ children }: { children: ReactNode }) => {
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUrl = localStorage.getItem('app-logo');
      if (storedUrl) {
        setLogoUrlState(storedUrl);
        setIsDefault(false);
      }
    } catch (error) {
      console.error("Failed to load logo from localStorage", error);
    } finally {
        setLoading(false);
    }
  }, []);

  const setLogoUrl = useCallback((url: string | null) => {
    if (url) {
      localStorage.setItem('app-logo', url);
      setLogoUrlState(url);
      setIsDefault(false);
    } else {
      localStorage.removeItem('app-logo');
      setLogoUrlState(null);
      setIsDefault(true);
    }
  }, []);

  if (loading) {
      return null; // or a loading spinner for the whole app
  }
  
  const logo = logoUrl ? <img src={logoUrl} alt="logo" className="h-16 w-16 object-contain" /> : <DefaultLogo />;

  return (
    <LogoContext.Provider value={{ logo, setLogoUrl, isDefaultLogo: isDefault }}>
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};
