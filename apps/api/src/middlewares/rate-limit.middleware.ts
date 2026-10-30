import rateLimit from "express-rate-limit";

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 mn;
  max: 10, // 10 tentatives max par Ip
  message: { error: "Trop de tentatives, réessayez dans 15 minutes." },
  standardHeaders: true, // envoie les headers RateLimit-* standard
  legacyHeaders: false,
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives d'inscription, réessayez plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    error: "Trop de requêtes de rafraichissement, réessayez plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mot de passe oublié : limite l'envoi d'emails (boîte inondée, coût d'envoi) et les essais de jetons
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Trop de demandes, réessayez dans une heure." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Saisie du nouveau mot de passe (jeton de 256 bits : la limite protège surtout le serveur)
export const resetPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives, réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
