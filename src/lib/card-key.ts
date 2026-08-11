/**
 * 卡密生成工具
 * 生成格式如 XXXX-XXXX-XXXX-XXXX 的 16 位卡密
 * 去掉易混淆字符 O/0/I/1/L，避免人工识别困难
 */
import { execute, ensureCardKeyTable, queryFirst } from '@/lib/d1';

// 卡密可用字符集（排除 O/0/I/1/L 等易混淆字符）
const CARD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 16;        // 卡密总长度 16 位
const GROUP_LENGTH = 4;        // 每组 4 位

/**
 * 生成单个 16 位卡密代码
 * 格式：XXXX-XXXX-XXXX-XXXX
 */
export function generateCardCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * CARD_CHARS.length);
    code += CARD_CHARS[idx];
    // 每组 4 位后添加连字符（最后一组不加）
    if ((i + 1) % GROUP_LENGTH === 0 && i < CODE_LENGTH - 1) {
      code += '-';
    }
  }
  return code;
}

/**
 * 生成唯一的卡密代码（查重保证不重复）
 */
async function generateUniqueCode(): Promise<string> {
  // 最多尝试 10 次，避免极端冲突
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCardCode();
    const exists = await queryFirst('SELECT id FROM CardKey WHERE code = ?', code);
    if (!exists) return code;
  }
  // 理论上几乎不可能走到这里
  return generateCardCode();
}

/** 卡密类型 */
export type CardKeyType = 'lingzhu' | 'agent_balance';

/** 生成的卡密对象 */
export interface CardKeyItem {
  id: string;
  code: string;
  type: CardKeyType;
  value: number;
  price: number;
  status: string;
  batchId: string;
  expiryAt: string | null;
  createdAt: string;
}

/**
 * 批量生成卡密
 * @param count      数量
 * @param type       类型：lingzhu(积分) / agent_balance(代理商余额)
 * @param value      面值（积分数或元数）
 * @param price      售价（元）
 * @param expiryDays 有效期天数（0 或负数表示永久）
 * @param createdBy  创建者 userId
 */
export async function generateBatch(
  count: number,
  type: CardKeyType,
  value: number,
  price: number,
  expiryDays: number,
  createdBy?: string
): Promise<CardKeyItem[]> {
  await ensureCardKeyTable();

  // 参数校验
  if (!count || count <= 0) throw new Error('生成数量必须大于 0');
  if (count > 1000) throw new Error('单次最多生成 1000 张卡密');
  if (!['lingzhu', 'agent_balance'].includes(type)) throw new Error('无效的卡密类型');
  if (!value || value <= 0) throw new Error('面值必须大于 0');

  const now = new Date().toISOString();
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 计算过期时间（expiryDays <= 0 表示永久）
  let expiryAt: string | null = null;
  if (expiryDays && expiryDays > 0) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    expiryAt = expiryDate.toISOString();
  }

  const items: CardKeyItem[] = [];
  for (let i = 0; i < count; i++) {
    const code = await generateUniqueCode();
    const id = `ck_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`;
    const item: CardKeyItem = {
      id,
      code,
      type,
      value,
      price,
      status: 'unused',
      batchId,
      expiryAt,
      createdAt: now,
    };
    await execute(
      `INSERT INTO CardKey (id, code, type, value, price, status, createdBy, batchId, expiryAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, code, type, value, price, 'unused', createdBy || null, batchId, expiryAt, now
    );
    items.push(item);
  }

  return items;
}
