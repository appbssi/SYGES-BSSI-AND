
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';

interface LogoContextType {
  logo: ReactNode;
  setLogoUrl: (url: string | null) => void;
  isDefaultLogo: boolean;
  isLogoLoading: boolean;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

const DefaultLogo = ({size = 16}: {size?: number}) => <Shield className={`h-${size} w-${size}`} />;

export const LogoProvider = ({ children }: { children: ReactNode }) => {
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLogo = localStorage.getItem('app-logo');
      if (storedLogo) {
        setLogoUrlState(storedLogo);
      }
    } catch (error) {
      console.error("Failed to load logo from localStorage", error);
    } finally {
      setIsLogoLoading(false);
    }
  }, []);

  const setLogoUrl = (url: string | null) => {
    setIsLogoLoading(true);
    try {
      if (url) {
        localStorage.setItem('app-logo', url);
        setLogoUrlState(url);
      } else {
        localStorage.removeItem('app-logo');
        setLogoUrlState(null);
      }
    } catch (error) {
      console.error("Failed to save logo to localStorage", error);
    } finally {
        setIsLogoLoading(false);
    }
  };

  const isDefault = !logoUrl;
  const loginLogo = logoUrl ? <img src={logoUrl} alt="logo" className="h-24 w-24 object-contain rounded-lg" /> : <DefaultLogo size={16} />;
  
  return (
    <LogoContext.Provider value={{ logo: loginLogo, setLogoUrl, isDefaultLogo: isDefault, isLogoLoading }}>
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  const { logo: loginLogo, isLogoLoading, setLogoUrl: setCtxLogoUrl, isDefaultLogo } = context;

  const [logoUrl, setLogoUrlState] = useState<string | null>(null);

  useEffect(() => {
      try {
        const storedLogo = localStorage.getItem('app-logo');
        if (storedLogo) {
          setLogoUrlState(storedLogo);
        } else {
          setLogoUrlState(null);
        }
      } catch (e) {}
  }, [isLogoLoading]);


  const sidebarLogo = logoUrl ? <img src={logoUrl} alt="logo" className="h-6 w-6 object-contain" /> : <DefaultLogo size={6} />;
  
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  return {
      logo: pathname === '/login' ? loginLogo : sidebarLogo,
      isLogoLoading,
      setLogoUrl: setCtxLogoUrl,
      isDefaultLogo,
  };
};
