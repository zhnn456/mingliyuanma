/**
 * 公告模块：多公告队列 + 已读追踪
 *
 * 设计：
 * - 数据存储于 Announcement 表（多条并存）
 * - 已读追踪：未登录用 localStorage（announcement_read_ids）
 * - 懒迁移：首次访问时若 Announcement 表为空，自动从旧 SiteConfig.announcement_floating 迁移 + 插入新公告
 */

import { queryFirst, queryAll, execute } from './d1';

export interface Announcement {
  id: string;
  icon: string;
  badge: string;
  title: string;
  content: string;
  link: string;
  linkText: string;
  enabled: number | boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/** 旧公告（注册送100灵珠） */
const SEED_REGISTER = {
  id: 'ann_reg_lingzhu',
  icon: '🎁',
  badge: '新用户福利',
  title: '注册即送 100 灵珠',
  content: '灵珠可用于八字排盘、奇门遁甲、紫微斗数等全部功能，免费体验专业命理测算。',
  link: '/register',
  linkText: '立即注册',
  enabled: 1,
  sortOrder: 0,
};

/** 新公告（源码部署·贴牌开户） */
const SEED_SOURCE_DEPLOY = {
  id: 'ann_src_deploy',
  icon: '🚀',
  badge: '限时优惠',
  title: '源码部署 · 贴牌开户',
  content:
    '获取完整源码自主部署，或贴牌开户自有品牌。8 月专享折扣，名额有限，立即咨询客服。',
  link: '/contact',
  linkText: '立即咨询',
  enabled: 1,
  sortOrder: 1,
};

const SEED_LIST = [SEED_REGISTER, SEED_SOURCE_DEPLOY];

/**
 * 懒迁移 + 种子：首次访问时若 Announcement 表为空则插入种子公告
 * 幂等：用固定 id + INSERT IGNORE，重复执行不会产生重复数据
 */
export async function ensureSeedAnnouncements(): Promise<void> {
  try {
    const countRow = (await queryFirst(
      'SELECT COUNT(*) as c FROM Announcement'
    )) as any;
    if (countRow && countRow.c > 0) return; // 已有数据，跳过

    // 尝试从旧 SiteConfig 迁移"注册送100灵珠"（若存在且内容不同）
    let migratedRegister = null;
    try {
      const row = (await queryFirst(
        "SELECT value FROM SiteConfig WHERE `key` = 'announcement_floating'"
      )) as any;
      if (row?.value) {
        const old = JSON.parse(row.value);
        if (old?.title) {
          migratedRegister = {
            ...SEED_REGISTER,
            icon: old.icon || SEED_REGISTER.icon,
            badge: old.badge || SEED_REGISTER.badge,
            title: old.title,
            content: old.content || SEED_REGISTER.content,
            link: old.link || SEED_REGISTER.link,
            linkText: old.linkText || SEED_REGISTER.linkText,
            enabled: old.enabled === false ? 0 : 1,
          };
        }
      }
    } catch {
      // 旧数据读取失败，用默认种子
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const list = migratedRegister
      ? [migratedRegister, SEED_SOURCE_DEPLOY]
      : SEED_LIST;

    for (const a of list) {
      await execute(
        'INSERT IGNORE INTO Announcement (id, icon, badge, title, content, link, linkText, enabled, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        a.id,
        a.icon,
        a.badge,
        a.title,
        a.content,
        a.link,
        a.linkText,
        a.enabled,
        a.sortOrder,
        now,
        now
      );
    }
  } catch (error) {
    // 表可能尚未创建（首次部署前），静默失败
    console.error('ensureSeedAnnouncements failed:', error);
  }
}

/** 获取所有启用的公告（公开接口，按 sortOrder, createdAt 升序） */
export async function listEnabledAnnouncements(): Promise<Announcement[]> {
  await ensureSeedAnnouncements();
  try {
    const rows = (await queryAll(
      'SELECT id, icon, badge, title, content, link, linkText, enabled, sortOrder, createdAt FROM Announcement WHERE enabled = 1 ORDER BY sortOrder ASC, createdAt ASC'
    )) as any[];
    return (rows || []).map(normalizeRow);
  } catch (error) {
    console.error('listEnabledAnnouncements failed:', error);
    return [];
  }
}

/** 获取所有公告（管理接口，含禁用） */
export async function listAllAnnouncements(): Promise<Announcement[]> {
  await ensureSeedAnnouncements();
  try {
    const rows = (await queryAll(
      'SELECT id, icon, badge, title, content, link, linkText, enabled, sortOrder, createdAt, updatedAt FROM Announcement ORDER BY sortOrder ASC, createdAt ASC'
    )) as any[];
    return (rows || []).map(normalizeRow);
  } catch (error) {
    console.error('listAllAnnouncements failed:', error);
    return [];
  }
}

function normalizeRow(r: any): Announcement {
  return {
    id: r.id,
    icon: r.icon,
    badge: r.badge,
    title: r.title,
    content: r.content || '',
    link: r.link || '',
    linkText: r.linkText || '查看详情',
    enabled: Number(r.enabled) === 1,
    sortOrder: r.sortOrder || 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/** 生成公告 ID */
export function genAnnouncementId(): string {
  return (
    'ann_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  );
}

/** 创建公告 */
export async function createAnnouncement(
  data: Partial<Announcement>
): Promise<Announcement | null> {
  try {
    const id = data.id || genAnnouncementId();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await execute(
      'INSERT IGNORE INTO Announcement (id, icon, badge, title, content, link, linkText, enabled, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      data.icon || '📢',
      data.badge || '公告',
      data.title || '',
      data.content || '',
      data.link || '',
      data.linkText || '查看详情',
      data.enabled === false ? 0 : 1,
      data.sortOrder ?? 0,
      now,
      now
    );
    return (await getAnnouncement(id)) || null;
  } catch (error) {
    console.error('createAnnouncement failed:', error);
    return null;
  }
}

/** 获取单条 */
export async function getAnnouncement(id: string): Promise<Announcement | null> {
  try {
    const row = (await queryFirst(
      'SELECT id, icon, badge, title, content, link, linkText, enabled, sortOrder, createdAt, updatedAt FROM Announcement WHERE id = ?',
      id
    )) as any;
    return row ? normalizeRow(row) : null;
  } catch {
    return null;
  }
}

/** 更新公告 */
export async function updateAnnouncement(
  id: string,
  data: Partial<Announcement>
): Promise<boolean> {
  try {
    const fields: string[] = [];
    const params: any[] = [];
    const set = (col: string, val: any) => {
      fields.push(`\`${col}\` = ?`);
      params.push(val);
    };
    if (data.icon !== undefined) set('icon', data.icon);
    if (data.badge !== undefined) set('badge', data.badge);
    if (data.title !== undefined) set('title', data.title);
    if (data.content !== undefined) set('content', data.content);
    if (data.link !== undefined) set('link', data.link);
    if (data.linkText !== undefined) set('linkText', data.linkText);
    if (data.enabled !== undefined) set('enabled', data.enabled ? 1 : 0);
    if (data.sortOrder !== undefined) set('sortOrder', data.sortOrder);
    if (fields.length === 0) return true;
    params.push(id);
    await execute(
      `UPDATE Announcement SET ${fields.join(', ')} WHERE id = ?`,
      ...params
    );
    return true;
  } catch (error) {
    console.error('updateAnnouncement failed:', error);
    return false;
  }
}

/** 删除公告 */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    await execute('DELETE FROM Announcement WHERE id = ?', id);
    return true;
  } catch (error) {
    console.error('deleteAnnouncement failed:', error);
    return false;
  }
}
