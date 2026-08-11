/**
 * PDF 报告生成系统
 * - 报告模板逻辑
 * - 水印防伪
 * - 付费解锁机制
 * - 通过浏览器 print-to-PDF 生成精美报告
 */

import { queryFirst } from '@/lib/d1';

// ============ 报告类型 ============

export type ReportType = 'bazi' | 'ziwei' | 'qimen' | 'meihua';

export interface ReportData {
  type: ReportType;
  title: string;
  subtitle: string;
  userInfo: {
    name?: string;
    gender?: string;
    birthDate?: string;
    birthTime?: string;
  };
  chartData: any; // 排盘数据
  interpretation: any; // 解读数据
  detailedAnalysis?: any; // 深度分析
  generatedAt: string;
  reportId: string;
  watermark: string;
}

// ============ 报告配置 ============

export const REPORT_CONFIG: Record<ReportType, {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  price: number;
}> = {
  bazi: {
    title: '四柱八字命理报告',
    subtitle: 'Four Pillars of Destiny Report',
    icon: '☰',
    color: '#B91C1C',
    price: 9.9,
  },
  ziwei: {
    title: '紫微斗数命理报告',
    subtitle: 'Zi Wei Dou Shu Report',
    icon: '★',
    color: '#7C3AED',
    price: 9.9,
  },
  qimen: {
    title: '奇门遁甲预测报告',
    subtitle: 'Qi Men Dun Jia Report',
    icon: '◈',
    color: '#2563EB',
    price: 9.9,
  },
  meihua: {
    title: '梅花易数占卜报告',
    subtitle: 'Mei Hua Yi Shu Report',
    icon: '✿',
    color: '#DB2777',
    price: 9.9,
  },
};

// ============ 报告生成 ============

/**
 * 生成报告 ID
 */
export function generateReportId(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RPT${dateStr}${random}`;
}

/**
 * 生成水印文本
 */
export function generateWatermark(userId: string, reportId: string): string {
  const userPart = userId.slice(-6).toUpperCase();
  const reportPart = reportId.slice(-6);
  return `知微阁 · ${userPart}-${reportPart}`;
}

/**
 * 从数据库加载排盘记录并生成报告数据
 */
export async function generateReportData(
  type: ReportType,
  recordId: string,
  userId: string
): Promise<ReportData | null> {
  const config = REPORT_CONFIG[type];
  const reportId = generateReportId();
  const watermark = generateWatermark(userId, reportId);

  let chartData: any = null;
  let interpretation: any = null;
  let detailedAnalysis: any = null;
  let userInfo: any = {};

  if (type === 'bazi') {
    const record = await queryFirst('SELECT * FROM BaziRecord WHERE id = ?', recordId) as any;
    if (!record || record.userId !== userId) return null;

    userInfo = {
      name: record.name || '未填写',
      gender: record.gender === 'male' ? '男（乾造）' : '女（坤造）',
      birthDate: record.birthDate,
      birthTime: record.birthTime,
    };

    chartData = {
      yearGan: record.yearGan,
      yearZhi: record.yearZhi,
      monthGan: record.monthGan,
      monthZhi: record.monthZhi,
      dayGan: record.dayGan,
      dayZhi: record.dayZhi,
      hourGan: record.hourGan,
      hourZhi: record.hourZhi,
      wuxing: record.wuxing ? JSON.parse(record.wuxing) : null,
      dayun: record.dayun ? JSON.parse(record.dayun) : null,
    };
    interpretation = record.interpretation ? JSON.parse(record.interpretation) : null;
    // 尝试解析深度分析
    if (interpretation?.detailedAnalysis) {
      detailedAnalysis = interpretation.detailedAnalysis;
    }
  } else if (type === 'ziwei') {
    const record = await queryFirst('SELECT * FROM ZiweiRecord WHERE id = ?', recordId) as any;
    if (!record || record.userId !== userId) return null;

    userInfo = {
      name: record.name || '未填写',
      gender: record.gender === 'male' ? '男' : '女',
      birthDate: record.birthDate,
      birthTime: record.birthTime,
    };

    chartData = {
      mingGong: record.mingGong,
      palaceData: record.palaceData ? JSON.parse(record.palaceData) : null,
      starData: record.starData ? JSON.parse(record.starData) : null,
      sihuaData: record.sihuaData ? JSON.parse(record.sihuaData) : null,
    };
    interpretation = record.interpretation ? JSON.parse(record.interpretation) : null;
    if (interpretation?.detailedAnalysis) {
      detailedAnalysis = interpretation.detailedAnalysis;
    }
  } else if (type === 'qimen') {
    const record = await queryFirst('SELECT * FROM QimenRecord WHERE id = ?', recordId) as any;
    if (!record || record.userId !== userId) return null;

    userInfo = {
      name: '问事占测',
      birthDate: record.queryTime,
    };

    chartData = {
      dunType: record.dunType,
      juNumber: record.juNumber,
      tianPan: record.tianPan ? JSON.parse(record.tianPan) : null,
      diPan: record.diPan ? JSON.parse(record.diPan) : null,
      renPan: record.renPan ? JSON.parse(record.renPan) : null,
      shenPan: record.shenPan ? JSON.parse(record.shenPan) : null,
    };
    interpretation = record.interpretation ? JSON.parse(record.interpretation) : null;
    if (interpretation?.detailedAnalysis) {
      detailedAnalysis = interpretation.detailedAnalysis;
    }
  } else if (type === 'meihua') {
    const record = await queryFirst('SELECT * FROM MeihuaRecord WHERE id = ?', recordId) as any;
    if (!record || record.userId !== userId) return null;

    userInfo = {
      name: '占卜问事',
    };

    chartData = {
      method: record.method,
      upperGua: record.upperGua,
      lowerGua: record.lowerGua,
      dongYao: record.dongYao,
      benGua: record.benGua,
      huGua: record.huGua,
      bianGua: record.bianGua,
      tiYong: record.tiYong,
    };
    interpretation = record.interpretation ? JSON.parse(record.interpretation) : null;
    if (interpretation?.detailedAnalysis) {
      detailedAnalysis = interpretation.detailedAnalysis;
    }
  }

  return {
    type,
    title: config.title,
    subtitle: config.subtitle,
    userInfo,
    chartData,
    interpretation,
    detailedAnalysis,
    generatedAt: new Date().toISOString(),
    reportId,
    watermark,
  };
}

/**
 * 检查用户是否有权限生成完整报告
 * - 年卡及以上会员：免费
 * - 免费用户：需付费购买
 */
export async function checkReportAccess(
  userId: string,
  type: ReportType,
  recordId: string
): Promise<{ allowed: boolean; reason?: string; needPayment?: boolean; price?: number }> {
  const user = await queryFirst('SELECT * FROM User WHERE id = ?', userId) as any;

  if (!user) {
    return { allowed: false, reason: '用户不存在' };
  }

  // 管理员和代理商免费
  if (['admin', 'agent'].includes(user.role)) {
    return { allowed: true };
  }

  // 年卡及以上会员免费
  if (['yearly', 'lifetime'].includes(user.memberLevel)) {
    // 检查会员是否过期
    if (user.memberExpiry && user.memberExpiry < new Date()) {
      return {
        allowed: false,
        reason: '会员已过期，请续费',
        needPayment: true,
        price: REPORT_CONFIG[type].price,
      };
    }
    return { allowed: true };
  }

  // 检查是否已购买此报告
  const existingOrder = await queryFirst(
    'SELECT * FROM "Order" WHERE userId = ? AND type = ? AND targetId = ? AND status = ?',
    userId, 'pdf_report', `${type}:${recordId}`, 'paid'
  );

  if (existingOrder) {
    return { allowed: true };
  }

  // 免费用户需要付费
  return {
    allowed: false,
    reason: '此报告为付费内容',
    needPayment: true,
    price: REPORT_CONFIG[type].price,
  };
}
