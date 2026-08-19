/**
 * 测试账号数据隔离模块
 *
 * 安全策略：
 * - 主管理员（PRIMARY_ADMIN_IDS / PRIMARY_ADMIN_EMAILS）可查看全部数据
 * - 其他测试 admin / demo / agent 账号只能看到测试用户数据
 *   （邮箱含 test / demo / example 的用户），看不到主管理员和真实用户
 *
 * 防止通过测试账号获取最高管理员权限或真实用户信息
 */

// 主管理员 ID 白名单（唯一能看全部数据的账号）
export const PRIMARY_ADMIN_IDS = ['admin', 'cm1admin001'];

// 主管理员邮箱白名单
export const PRIMARY_ADMIN_EMAILS = (process.env.PRIMARY_ADMIN_EMAIL || '').split(',').filter(Boolean);

// 测试用户邮箱关键词（命中这些关键词的用户对测试账号可见）
const TEST_EMAIL_KEYWORDS = ['test', 'demo', 'example', '@test', '@example'];

/** 判断当前 session 是否为主管理员（可看全部数据） */
export function isPrimaryAdmin(session: any): boolean {
  if (!session) return false;
  const userId = session.sub || session.userId || '';
  const email = session.email || '';
  return PRIMARY_ADMIN_IDS.includes(userId) || PRIMARY_ADMIN_EMAILS.includes(email);
}

/**
 * 构造用户列表的隔离过滤条件
 *
 * 主管理员：返回空（不过滤）
 * 非主管理员：只看测试用户（邮箱含 test/demo/example），排除主管理员
 *
 * 返回 { where, params } 用于拼接到 SQL 的 WHERE 子句
 */
export function buildUserIsolationClause(session: any): { where: string; params: any[] } {
  if (isPrimaryAdmin(session)) {
    return { where: '', params: [] };
  }

  // 非主管理员：只看测试用户
  const currentUserId = session?.sub || session?.userId || '';

  // 条件：(邮箱含测试关键词) OR (是自己)
  // 排除主管理员邮箱（双保险）
  const likeConditions = TEST_EMAIL_KEYWORDS.map(() => 'email LIKE ?').join(' OR ');
  const likeParams = TEST_EMAIL_KEYWORDS.map(k => `%${k}%`);

  // 只有当有主管理员邮箱时才添加排除子句，避免生成空括号语法错误
  const excludeEmailsClause = PRIMARY_ADMIN_EMAILS.length > 0
    ? ` AND email NOT IN (${PRIMARY_ADMIN_EMAILS.map(() => '?').join(',')})`
    : '';
  const excludeEmailsParams = PRIMARY_ADMIN_EMAILS.length > 0
    ? [...PRIMARY_ADMIN_EMAILS]
    : [];

  return {
    where: `(${likeConditions} OR id = ?)${excludeEmailsClause}`,
    params: [...likeParams, currentUserId, ...excludeEmailsParams],
  };
}

/**
 * 构造管理员列表的隔离过滤条件
 *
 * 主管理员：返回空（不过滤）
 * 非主管理员：只看测试管理员（邮箱含 test），排除主管理员
 */
export function buildAdminIsolationClause(session: any): { where: string; params: any[] } {
  if (isPrimaryAdmin(session)) {
    return { where: '', params: [] };
  }

  // 非主管理员：只看邮箱含 test 的管理员，排除主管理员 ID 和邮箱
  const idPlaceholders = PRIMARY_ADMIN_IDS.map(() => '?').join(',');
  const emailPlaceholders = PRIMARY_ADMIN_EMAILS.map(() => '?').join(',');

  // 只有当有主管理员邮箱时才添加排除子句
  const excludeEmailsClause = PRIMARY_ADMIN_EMAILS.length > 0
    ? ` AND email NOT IN (${emailPlaceholders})`
    : '';

  return {
    where: `(email LIKE ?) AND id NOT IN (${idPlaceholders})${excludeEmailsClause}`,
    params: ['%test%', ...PRIMARY_ADMIN_IDS, ...PRIMARY_ADMIN_EMAILS],
  };
}
