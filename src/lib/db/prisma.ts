import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;
let initPromise: Promise<PrismaClient> | null = null;

export async function getPrisma(): Promise<PrismaClient> {
  if (prismaClient) return prismaClient;
  if (initPromise) return initPromise;

  // 普通服务器环境：直接使用 PrismaClient（通过 DATABASE_URL 连接数据库）
  initPromise = (async () => {
    prismaClient = new PrismaClient();
    return prismaClient;
  })();

  return initPromise;
}
