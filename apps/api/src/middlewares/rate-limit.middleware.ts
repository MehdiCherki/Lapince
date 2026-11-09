import rateLimit, { type Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { config } from "../config.ts";
import { logger } from "../lib/logger.ts";
import { redis } from "../lib/redis.ts";

// Compteurs dans Redis (src/lib/redis.ts) : partagés par toutes les instances de l'API et conservés
// quand elle redémarre. Clé : préfixe du limiteur + adresse IP du visiteur (req.ip, voir app.ts),
// par exemple rl:login:203.0.113.10. Opérations sur Redis, par le script Lua de rate-limit-redis :
//   - 1re tentative : SET clé 1 PX <fenêtre> (création, avec sa durée de vie) ;
//   - tentatives suivantes : INCR (mise à jour), et PTTL (lecture du temps restant, renvoyé dans
//     Retry-After et RateLimit-Reset) ;
//   - fin de la fenêtre : Redis supprime la clé.
function limiter(name: string, options: Partial<Options>) {
  return rateLimit({
    standardHeaders: true, // envoie les headers RateLimit-* standard
    legacyHeaders: false,
    // Un stockage par limiteur, chacun sous son préfixe
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.sendCommand(args),
      prefix: `${config.rateLimitPrefix}${name}:`,
    }),
    // Redis indisponible : la requête passe sans limite plutôt que d'échouer. Tout bloquer rendrait
    // l'application inaccessible (et le rafraîchissement de session déconnecterait tout le monde).
    // Chaque incident est journalisé ; Redis n'est joignable que depuis le réseau interne de l'API.
    passOnStoreError: true,
    logger,
    ...options,
  });
}

export const loginRateLimit = limiter("login", {
  windowMs: 15 * 60 * 1000, // fenêtre de 15 mn;
  limit: 10, // 10 tentatives max par Ip
  // Seuls les échecs comptent : une connexion réussie rend son essai (DECR). Le compteur n'est pas
  // remis à zéro : un attaquant l'effacerait en se connectant à son propre compte entre deux essais.
  skipSuccessfulRequests: true,
  message: { error: "Trop de tentatives, réessayez dans 15 minutes." },
});

export const registerRateLimit = limiter("register", {
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { error: "Trop de tentatives d'inscription, réessayez plus tard." },
});

export const refreshRateLimit = limiter("refresh", {
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: {
    error: "Trop de requêtes de rafraichissement, réessayez plus tard.",
  },
});

// Mot de passe oublié : limite l'envoi d'emails (boîte inondée, coût d'envoi) et les essais de jetons
export const passwordResetRateLimit = limiter("forgot-password", {
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { error: "Trop de demandes, réessayez dans une heure." },
});

// Saisie du nouveau mot de passe (jeton de 256 bits : la limite protège surtout le serveur)
export const resetPasswordRateLimit = limiter("reset-password", {
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Trop de tentatives, réessayez dans 15 minutes." },
});
