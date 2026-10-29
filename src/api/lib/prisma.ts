import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);

// On réexporte tous les modèles pour faciliter leur utilisatation dans le reste de l'application
export * from "@prisma/client";

export const prisma = new PrismaClient({ adapter });
