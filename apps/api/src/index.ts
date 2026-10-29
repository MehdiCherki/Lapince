import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRouter from "../routes/auth.routes.js";
import userRouter from "../routes/user.routes.js";
import categoryRouter from "../routes/category.routes.js";
import transactionRouter from "../routes/transaction.routes.js";
import budgetRoutes from "../routes/budget.routes.js";
import alertRoutes from "../routes/alert.routes.js";
import statsRoutes from "../routes/stats.routes.js";
import { errorMiddleware } from "../middlewares/error.middleware.js";
import { logger } from "../lib/logger.js";
import { config } from "../config.js";

// Créer une app Express
const app = express();
// Navigateur → nginx-proxy → nginx du client → API : deux proxys sur le réseau Docker (adresses privées).
// On fait confiance aux adresses privées : req.ip devient la première adresse publique de
// X-Forwarded-For, c'est-à-dire le vrai visiteur (indispensable au rate limit par IP).
// Pas de nombre fixe de proxys : s'il en restait un seul, "2" ferait confiance à une adresse inventée.
app.set("trust proxy", "loopback, uniquelocal");
const PORT = Number(process.env.PORT) || 3007;

// Sécuriser les headers HTTP
app.use(helmet());

// Autoriser les requêtes cross-origin
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parser pour récupérer les body "application/json" dans req.body
app.use(express.json());

//Middleware : Analyse les cookies de la requête pour extraire les tokens d'authentification (JWT) et les préférences utilisateur.
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/categories", categoryRouter);
app.use("/transactions", transactionRouter);
app.use("/budgets", budgetRoutes);
app.use("/alerts", alertRoutes);
app.use("/stats", statsRoutes);

app.use(errorMiddleware);

export default app;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`🚀 Server started at http://localhost:${PORT}`);
  });
}
