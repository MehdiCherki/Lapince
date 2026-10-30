export interface RequestUser {
  id: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      // On définit un type léger pour la session utilisateur
      user?: RequestUser;
    }
  }
}
