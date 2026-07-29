import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;
let initPromise: Promise<PrismaClient> | null = null;

export async function getPrisma(): Promise<PrismaClient> {
  if (prismaClient) return prismaClient;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { getCloudflareContext } = require('@opennextjs/cloudflare');
      const { PrismaD1 } = require('@prisma/adapter-d1');
      const ctx = await getCloudflareContext({ async: true });
      if (ctx?.env?.DB) {
        prismaClient = new PrismaClient({ adapter: new PrismaD1(ctx.env.DB) });
        return prismaClient;
      }
    } catch {
      // 不在 Cloudflare Workers 环境
    }

    prismaClient = new PrismaClient();
    return prismaClient;
  })();

  return initPromise;
}
