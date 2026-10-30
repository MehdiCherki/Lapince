// Objet contexte d'authentification, séparé du composant AuthProvider (AuthContext.tsx) :
// un fichier qui exporte un composant ne doit exporter que des composants, sinon le
// rechargement à chaud de Vite ne fonctionne plus (règle react-refresh/only-export-components).

import { createContext } from "react";
import type { AuthUser } from "@/types/auth";

export interface AuthContextType {
  user: AuthUser | null;
  login: (userData: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
