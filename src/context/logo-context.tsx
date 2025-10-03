
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";

interface LogoContextType {
  logo: string | null;
  setLogo: (logoDataUrl: string) => void;
  clearLogo: () => void;
  isLoading: boolean;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

const LOGO_STORAGE_KEY = "ebrigade_custom_logo";

export const LogoProvider = ({ children }: { children: ReactNode }) => {
  const [logo, setLogoState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
      if (storedLogo) {
        setLogoState(storedLogo);
      }
    } catch (error) {
      console.error("Failed to load logo from localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const setLogo = (logoDataUrl: string) => {
    try {
      localStorage.setItem(LOGO_STORAGE_KEY, logoDataUrl);
      setLogoState(logoDataUrl);
    } catch (error) {
        console.error("Failed to save logo to localStorage", error);
    }
  };

  const clearLogo = () => {
    try {
      localStorage.removeItem(LOGO_STORAGE_KEY);
      setLogoState(null);
    } catch (error) {
        console.error("Failed to remove logo from localStorage", error);
    }
  };

  return (
    <LogoContext.Provider value={{ logo, setLogo, clearLogo, isLoading }}>
      {!isLoading && children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error("useLogo must be used within a LogoProvider");
  }
  return context;
};
