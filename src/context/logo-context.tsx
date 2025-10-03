
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Shield } from 'lucide-react';

interface LogoContextType {
  logo: ReactNode;
  setLogoUrl: (url: string | null) => void;
  isDefaultLogo: boolean;
  isLogoLoading: boolean;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

const DefaultLogo = () => <Shield className="h-full w-full" />;

export const LogoProvider = ({ children }: { children: ReactNode }) => {
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  useEffect(() => {
    // This effect runs only on the client, after hydration.
    // This prevents a server/client mismatch.
    setIsLogoLoading(true);
    try {
      const storedLogo = localStorage.getItem('app-logo');
      if (storedLogo) {
        setLogoUrlState(storedLogo);
      } else {
        setLogoUrlState(null); // Ensure state is reset if item is removed
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

  // During server render and initial client render, always show the default logo
  // to prevent hydration mismatch. The actual logo will be shown after the
  // useEffect hook runs on the client.
  const logoComponent = (isLogoLoading || !logoUrl)
    ? <DefaultLogo />
    : <img src={logoUrl} alt="logo" className="h-full w-full object-contain" />;
  
  return (
    <LogoContext.Provider value={{ logo: logoComponent, setLogoUrl, isDefaultLogo: isDefault, isLogoLoading }}>
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
