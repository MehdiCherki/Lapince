import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);

// Les types des modèles s'importent depuis "@prisma/client" ; ce fichier ne fournit que le client
export const prisma = new PrismaClient({ adapter });
