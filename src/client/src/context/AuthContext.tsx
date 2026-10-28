// Ce fichier contient le contexte global d'authentification de l'application. Il gère l'état de l'utilisateur connecté, les fonctions de connexion et de déconnexion,
// ainsi que la vérification de session au démarrage de l'application.

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { fetchCurrentUser, fetchLogout } from '../services/authApi';
import type { AuthUser } from '../types/auth';
import { refreshOnce } from '../services/apiClient';


interface AuthContextType {
  user: AuthUser | null;
  login: (userData: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Empêche l'affichage de l'app tant qu'on ne sait pas si l'utilisateur est connecté
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Si le cookie indicateur est absent, aucune session n'existe → pas d'appel API inutile
      if (!document.cookie.includes("sessionExists=1")) {
        setIsInitializing(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch {
        try {
          await refreshOnce();
          const currentUser = await fetchCurrentUser();
          setUser(currentUser);
        } catch {
          setUser(null);
        }
      } finally {
        setIsInitializing(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("session-expired", onExpired);
    return () => window.removeEventListener("session-expired", onExpired);
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetchLogout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isInitializing }}>
      {!isInitializing && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
