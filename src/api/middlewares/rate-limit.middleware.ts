import rateLimit from "express-rate-limit";

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 mn;
  max: 10, // 10 tentatives max par Ip
  message: { error: "Trop de tentatives, réessayez dans 15 minutes." },
  standardHeaders: true, // envoie les headers RateLimit-* standard
  legacyHeaders: false,
});

export const registerRateLimit = rateLimit({
  windowMs: 60 *60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives d'inscription, réessayez plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
})

export const refreshRateLimit = rateLimit({
  windowMs: 15 *60 * 1000,
  max: 30,
  message: { error: "Trop de requêtes de rafraichissement, réessayez plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
})