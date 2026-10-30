// Corps de PATCH /users/me : seuls les champs envoyés sont modifiés
export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  photo?: string | null;
  // Exigé par l'API pour changer l'email ou le mot de passe
  currentPassword?: string;
};
