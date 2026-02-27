/**
 * lib/db.ts — Prisma Client singleton
 *
 * Next.js hot-reload creates new module instances in development, which would
 * exhaust the Postgres connection pool.  We attach the client to `globalThis`
 * so it is reused across hot-reloads, while production always creates exactly
 * one instance.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
