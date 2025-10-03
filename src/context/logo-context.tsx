
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface LogoContextType {
  logo: ReactNode;
  setLogoUrl: (url: string | null) => Promise<void>;
  isDefaultLogo: boolean;
  isLogoLoading: boolean;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

const DefaultLogo = ({size = 16}: {size?: number}) => <Shield className={`h-${size} w-${size}`} />;

export const LogoProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();

  const logoDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'app-logo');
  }, [firestore]);

  const { data: logoData, isLoading: isLogoLoading } = useDoc<{url: string}>(logoDocRef);
  
  const logoUrl = logoData?.url;
  const isDefault = !logoUrl;

  const setLogoUrl = useCallback(async (url: string | null) => {
    if (!logoDocRef) {
        console.error("Firestore not initialized, cannot save logo.");
        return;
    }
    if (url) {
        await setDoc(logoDocRef, { url });
    } else {
        await deleteDoc(logoDocRef);
    }
  }, [logoDocRef]);

  const sidebarLogo = logoUrl ? <img src={logoUrl} alt="logo" className="h-6 w-6 object-contain" /> : <DefaultLogo size={6} />;
  const loginLogo = logoUrl ? <img src={logoUrl} alt="logo" className="h-16 w-16 object-contain" /> : <DefaultLogo size={16} />;
  
  // This logic is tricky. The `logo` in context can't be one-size-fits-all.
  // Let's provide both and let the consumer decide.
  // For this simplified case, we will adapt based on what we had before.
  // The login page had a large logo, sidebar a small one.

  const logoForContext = {
      sidebar: sidebarLogo,
      login: loginLogo,
  }

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
  const { logo: loginLogo, ...rest } = context;

  const firestore = useFirestore();

  const logoDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'app-logo');
  }, [firestore]);

  const { data: logoData } = useDoc<{url: string}>(logoDocRef);
  
  const logoUrl = logoData?.url;
  
  // A bit of a hack to serve two different logo sizes from one context
  const sidebarLogo = logoUrl ? <img src={logoUrl} alt="logo" className="h-6 w-6 object-contain" /> : <DefaultLogo size={6} />;
  
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  return {
      logo: pathname === '/login' ? loginLogo : sidebarLogo,
      ...rest
  };
};
