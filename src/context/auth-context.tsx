
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";

type UserRole = "admin" | "viewer";

interface User {
  username: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_USERS = {
  bssi: { password: "adminR", role: "admin" as UserRole },
  bssi1: { password: "admin1", role: "viewer" as UserRole },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load user from localStorage on initial load
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (username: string, password: string) => {
    const userCredentials = ALLOWED_USERS[username as keyof typeof ALLOWED_USERS];
    if (userCredentials && userCredentials.password === password) {
      const userData: User = { username, role: userCredentials.role };
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    }
    return { success: false, message: "Login ou mot de passe incorrect." };
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
