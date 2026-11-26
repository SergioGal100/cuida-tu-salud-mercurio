import { PrismaClient } from "@prisma/client";

// Un solo cliente por proceso (evita agotar conexiones en desarrollo).
const global_ = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = global_.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global_.prisma = prisma;
