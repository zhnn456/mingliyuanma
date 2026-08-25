/**
 * 安全工具库
 * 注意：单实例限流，如需更强防护可在 Nginx 层配置限流
 */

import { NextRequest, NextResponse } from 'next/server';
import { execute, queryFirst } from './d1';
import { getClientIPFromHeaders } from './client-ip';

// ============ 输入清理 ============

/**
 * 清理字符串输入，防止 XSS
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 1000);
}

/**
 * 清理对象中的所有字符串字段
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      result[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      result[key] = sanitizeObject(obj[key]);
    } else if (Array.isArray(obj[key])) {
      result[key] = obj[key].map((item: any) =>
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item) : item
      );
    } else {
      result[key] = obj[key];
    }
  }
  return result as T;
}

// ============ 验证器 ============

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;

export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  return PHONE_REGEX.test(phone);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: '密码至少8位' };
  }
  if (password.length > 128) {
    return { valid: false, message: '密码不能超过128位' };
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, message: '密码必须包含字母和数字' };
  }
  return { valid: true };
}

export function validateYear(year: number): boolean {
  return year >= 1900 && year <= 2100;
}

export function validateMonth(month: number): boolean {
  return month >= 1 && month <= 12;
}

export function validateDay(day: number): boolean {
  return day >= 1 && day <= 31;
}

export function validateHour(hour: number): boolean {
  return hour >= 0 && hour <= 23;
}

/**
 * 验证并清理数字输入
 */
export function sanitizeNumber(input: unknown, min?: number, max?: number): number | null {
  const num = typeof input === 'number' ? input : parseInt(String(input), 10);
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  return num;
}

// ============ IP 限流（数据库持久化，多实例/Serverless 均有效） ============

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 内存兜底（数据库异常时降级为单机限流）
const rateLimitMap = new Map<string, RateLimitEntry>();

let rateLimitTableReady = false;

async function ensureRateLimitTable(): Promise<void> {
  if (rateLimitTableReady) return;
  await execute(
    'CREATE TABLE IF NOT EXISTS RateLimitBucket (bucketKey VARCHAR(191) PRIMARY KEY, count INT NOT NULL DEFAULT 0, windowStart BIGINT NOT NULL)'
  );
  rateLimitTableReady = true;
}

function memoryRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `ip:${ip}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

/**
 * IP 级别速率限制（固定窗口计数，持久化到数据库，跨实例生效）
 */
export async function checkIPRateLimit(
  ip: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    await ensureRateLimitTable();
    const key = `ip:${ip}`.slice(0, 180);
    const now = Date.now();

    const bumped = await execute(
      'UPDATE RateLimitBucket SET count = count + 1 WHERE bucketKey = ? AND windowStart > ?',
      key, now - windowMs
    );

    if (bumped.changes === 0) {
      await execute('DELETE FROM RateLimitBucket WHERE bucketKey = ?', key);
      try {
        await execute(
          'INSERT INTO RateLimitBucket (bucketKey, count, windowStart) VALUES (?, 1, ?)',
          key, now
        );
      } catch {
        await execute(
          'UPDATE RateLimitBucket SET count = count + 1 WHERE bucketKey = ? AND windowStart > ?',
          key, now - windowMs
        );
      }
    }

    const row = await queryFirst('SELECT count, windowStart FROM RateLimitBucket WHERE bucketKey = ?', key) as any;
    const count = Number(row?.count || 1);
    const resetTime = Number(row?.windowStart || now) + windowMs;

    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetTime,
    };
  } catch {
    return memoryRateLimit(ip, maxRequests, windowMs);
  }
}

/**
 * 获取客户端真实 IP
 * 安全基线（安全审计 V-1）：不可信任 XFF 首元素（客户端可伪造），
 * 统一走 client-ip.ts 的信任链：CF-Connecting-IP > X-Real-IP > XFF 最后元素
 */
export function getClientIP(req: NextRequest): string {
  return getClientIPFromHeaders(req.headers);
}

/**
 * API 速率限制中间件
 */
export function withRateLimit(maxRequests: number = 60, windowMs: number = 60_000) {
  return async function (req: NextRequest): Promise<NextResponse | null> {
    const ip = getClientIP(req);
    const result = await checkIPRateLimit(ip, maxRequests, windowMs);
    if (!result.allowed) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
            'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }
    return null;
  };
}

// ============ 安全响应头 ============

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}
