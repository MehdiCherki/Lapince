import { User } from "./auth.ts";

export interface UserPayload {
  id: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      // On définit un type léger pour la session utilisateur
      user?: UserPayload;
    }
  }
}
