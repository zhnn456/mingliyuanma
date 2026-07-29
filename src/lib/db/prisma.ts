import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;

/**
 * 获取 Prisma 实例（延迟初始化）
 * 在 Cloudflare Workers 上，getCloudflareContext 只能在请求处理期间调用
 * 所以不能像普通 Node.js 那样在模块加载时初始化
 */
function getPrisma(): PrismaClient {
  if (prismaClient) return prismaClient;

  // 尝试用 D1 adapter（Cloudflare Workers/Pages）
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const { PrismaD1 } = require('@prisma/adapter-d1');
    const ctx = getCloudflareContext({ async: false });
    if (ctx?.env?.DB) {
      prismaClient = new PrismaClient({ adapter: new PrismaD1(ctx.env.DB) });
      return prismaClient;
    }
  } catch {
    // 不在 Cloudflare Workers 环境
  }

  // 本地开发 — SQLite
  prismaClient = new PrismaClient();
  return prismaClient;
}

/**
 * 使用 Proxy 实现透明的延迟初始化
 * 不管在哪个环境，import { prisma } from '@/lib/db/prisma' 后都能直接用
 * 第一次调用 prisma.user.findMany() 等操作时才会真正初始化
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: keyof PrismaClient) {
    const client = getPrisma();
    return client[prop];
  },
});
