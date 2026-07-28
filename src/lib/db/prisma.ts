import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * 创建 PrismaClient 实例
 * - Cloudflare Pages 环境：通过 D1 adapter 连接 D1 数据库
 * - 本地开发环境：通过 DATABASE_URL 连接本地 SQLite
 */
function createPrismaClient(): PrismaClient {
  // Cloudflare Pages 环境
  if (process.env.CF_PAGES === '1') {
    try {
      // @ts-ignore - @cloudflare/next-on-pages 仅在 CF 环境安装
      const { getRequestContext } = require('@cloudflare/next-on-pages');
      // @ts-ignore - @prisma/adapter-d1 仅在 CF 环境安装
      const { PrismaD1 } = require('@prisma/adapter-d1');
      const env = getRequestContext().env;
      const adapter = new PrismaD1(env.DB);
      return new PrismaClient({ adapter });
    } catch (e) {
      console.error('[Prisma] D1 adapter initialization failed:', e);
      throw e;
    }
  }

  // 本地开发环境 - 普通 SQLite
  return new PrismaClient();
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}

export const prisma = globalForPrisma.prisma;
