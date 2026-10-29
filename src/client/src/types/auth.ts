// Types liés à l'authentification
// correpond aux champs de la route POST /auth/register
//C'est la forme des données dans le formulaire React, côté front. Quand l'utilisateur tape son prénom, son nom, son email et son mot de passe, ces 4 champs forment un objet de type RegisterFormData.
export interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  photo?: string;
}

// On ne met JAMAIS le mot de passe ni les refreshTokens dans l'interface Front-end !
// C'est une règle de sécurité absolue (CP6).
export interface AuthUser {
  id: number;
  first_name: string; // Attention au snake_case imposé par ton modèle Prisma
  last_name: string;
  email: string;
  photo: string | null; // Peut être null selon Prisma (String?)
  createdAt: string; // En JSON, les dates arrivent sous forme de string (ISO 8601)
  updatedAt: string;
}

// C'est la forme de l'erreur que le serveur peut renvoyer en cas de problème, par exemple si l'email est déjà utilisé ou si le mot de passe est trop court.
export interface ApiError {
  error: string;
  field?: string;
}
