import rateLimit from "express-rate-limit";

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 mn;
  max: 10, // 10 tentatives max par Ip
  message: { error: "Trop de tentatives, réessayez dans 15 minutes." },
  standardHeaders: true, // envoie les headers RateLimit-* standard
  legacyHeaders: false,
});
