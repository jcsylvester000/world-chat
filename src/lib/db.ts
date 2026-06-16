// Prisma client singleton — SERVER ONLY. Import this only from Route Handlers
// (src/app/api/**) or server repos (src/server/**), never from a client
// component or a Zustand store (the browser cannot run Prisma).
//
// The singleton avoids exhausting the connection pool during Next.js hot
// reload in development (each reload would otherwise create a new client).
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
