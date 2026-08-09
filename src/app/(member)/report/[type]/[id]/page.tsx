'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReportPage() {
  const { user: session } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState('');
  const [needPayment, setNeedPayment] = useState(false);
  const [price, setPrice] = useState(0);

  const type = params.type as string;
  const recordId = params.id as string;

  useEffect(() => {
    if (!session) return;
    loadReport();
  }, [session, type, recordId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report/generate?type=${type}&recordId=${recordId}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.needPayment) {
          setNeedPayment(true);
          setPrice(data.price);
        }
        setError(data.error || '加载失败');
      } else {
        setReport(data.report);
        setConfig(data.config);
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pdf_report',
          targetId: `${type}:${recordId}`,
          method: 'mock',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Mock 支付确认
      const confirmRes = await fetch('/api/payment/mock-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo: data.order.orderNo }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error);

      // 重新加载报告
      loadReport();
    } catch (e: any) {
      setError(e.message || '支付失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin-slow w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">正在生成报告...</p>
        </div>
      </div>
    );
  }

  // 需要付费
  if (needPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full card p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">付费内容</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <div className="bg-amber-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">单次报告价格</p>
            <p className="text-3xl font-bold text-amber-600">¥{price}</p>
          </div>
          <div className="space-y-3">
            <button onClick={handlePayment} className="w-full btn-primary py-3">
              立即购买 (¥{price})
            </button>
            <Link href="/membership" className="block w-full btn-outline py-3 text-center">
              升级会员免费查看
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard" className="btn-primary px-6 py-2">返回</Link>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 工具栏 */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </Link>
          <button
            onClick={() => window.print()}
            className="btn-primary text-sm !py-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下载PDF
          </button>
        </div>
      </div>

      {/* 报告内容 */}
      <div className="max-w-4xl mx-auto px-4 py-8 print:py-0 print:px-0">
        <div className="report-page bg-white shadow-lg print:shadow-none" style={{ minHeight: '297mm' }}>
          {/* 水印 */}
          <div className="report-watermark">{report.watermark}</div>

          {/* 报告头部 */}
          <div className="report-header" style={{ borderColor: config?.color }}>
            <div className="report-header-icon" style={{ background: config?.color }}>
              {config?.icon}
            </div>
            <h1 className="report-title">{report.title}</h1>
            <p className="report-subtitle">{report.subtitle}</p>
            <div className="report-divider" style={{ background: config?.color }} />
          </div>

          {/* 基本信息栏 */}
          <div className="report-info-bar">
            <div className="report-info-item">
              <span className="report-info-label">姓名</span>
              <span className="report-info-value">{report.userInfo.name}</span>
            </div>
            {report.userInfo.gender && (
              <div className="report-info-item">
                <span className="report-info-label">性别</span>
                <span className="report-info-value">{report.userInfo.gender}</span>
              </div>
            )}
            {report.userInfo.birthDate && (
              <div className="report-info-item">
                <span className="report-info-label">出生日期</span>
                <span className="report-info-value">{report.userInfo.birthDate}</span>
              </div>
            )}
            {report.userInfo.birthTime && (
              <div className="report-info-item">
                <span className="report-info-label">出生时辰</span>
                <span className="report-info-value">{report.userInfo.birthTime}</span>
              </div>
            )}
            <div className="report-info-item">
              <span className="report-info-label">报告编号</span>
              <span className="report-info-value font-mono text-xs">{report.reportId}</span>
            </div>
          </div>

          {/* 报告内容 - 根据类型渲染 */}
          <div className="report-content">
            <ReportContent type={type} report={report} />
          </div>

          {/* 报告尾部 */}
          <div className="report-footer">
            <div className="report-footer-divider" />
            <p className="report-footer-text">本报告由先知命理网自动生成 · 仅供参考</p>
            <p className="report-footer-date">生成时间：{new Date(report.generatedAt).toLocaleString('zh-CN')}</p>
            <p className="report-footer-watermark">{report.watermark}</p>
          </div>
        </div>
      </div>

      {/* 打印样式 */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          @page { size: A4; margin: 0; }
          .print\\:hidden { display: none !important; }
        }

        .report-page {
          position: relative;
          padding: 40px;
          border-radius: 0;
          overflow: hidden;
        }

        @media print {
          .report-page {
            padding: 20mm;
            box-shadow: none !important;
          }
        }

        .report-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 60px;
          color: rgba(200, 164, 92, 0.08);
          white-space: nowrap;
          pointer-events: none;
          z-index: 0;
          font-family: 'KaiTi', serif;
        }

        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid;
          position: relative;
          z-index: 1;
        }

        .report-header-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          color: white;
          font-size: 24px;
        }

        .report-title {
          font-size: 24px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 4px;
          font-family: 'KaiTi', serif;
        }

        .report-subtitle {
          font-size: 12px;
          color: #999;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }

        .report-divider {
          width: 60px;
          height: 3px;
          margin: 0 auto;
          border-radius: 2px;
        }

        .report-info-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          padding: 16px 20px;
          background: #f7f2e8;
          border-radius: 8px;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }

        .report-info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .report-info-label {
          font-size: 10px;
          color: #999;
        }

        .report-info-value {
          font-size: 13px;
          color: #333;
          font-weight: 500;
        }

        .report-content {
          position: relative;
          z-index: 1;
        }

        .report-section {
          margin-bottom: 24px;
        }

        .report-section-title {
          font-size: 16px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 12px;
          padding-left: 12px;
          border-left: 3px solid #B91C1C;
          font-family: 'KaiTi', serif;
        }

        .report-section-text {
          font-size: 13px;
          line-height: 1.8;
          color: #444;
          text-align: justify;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }

        .report-table th {
          background: #f7f2e8;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          border: 1px solid #e8e0d0;
        }

        .report-table td {
          padding: 8px 12px;
          font-size: 13px;
          color: #333;
          border: 1px solid #e8e0d0;
        }

        .report-card {
          padding: 12px 16px;
          background: #faf8f4;
          border-radius: 8px;
          border: 1px solid #e8e0d0;
          margin-bottom: 8px;
        }

        .report-card-title {
          font-size: 13px;
          font-weight: 600;
          color: #B91C1C;
          margin-bottom: 4px;
        }

        .report-card-text {
          font-size: 12px;
          color: #555;
          line-height: 1.7;
        }

        .report-footer {
          margin-top: 40px;
          padding-top: 20px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .report-footer-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c8a45c, transparent);
          margin-bottom: 12px;
        }

        .report-footer-text {
          font-size: 11px;
          color: #999;
        }

        .report-footer-date {
          font-size: 10px;
          color: #bbb;
          margin-top: 4px;
        }

        .report-footer-watermark {
          font-size: 9px;
          color: #ccc;
          margin-top: 8px;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}

// ============ 报告内容组件 ============

function ReportContent({ type, report }: { type: string; report: any }) {
  if (type === 'bazi') {
    return <BaziReport report={report} />;
  } else if (type === 'ziwei') {
    return <ZiweiReport report={report} />;
  } else if (type === 'qimen') {
    return <QimenReport report={report} />;
  } else if (type === 'meihua') {
    return <MeihuaReport report={report} />;
  }
  return null;
}

function BaziReport({ report }: { report: any }) {
  const { chartData, interpretation, detailedAnalysis } = report;
  const pillars = chartData ? [
    { label: '年柱', gan: chartData.yearGan, zhi: chartData.yearZhi },
    { label: '月柱', gan: chartData.monthGan, zhi: chartData.monthZhi },
    { label: '日柱', gan: chartData.dayGan, zhi: chartData.dayZhi },
    { label: '时柱', gan: chartData.hourGan, zhi: chartData.hourZhi },
  ].filter(p => p.gan && p.zhi) : [];

  return (
    <>
      {/* 四柱排盘 */}
      <div className="report-section">
        <h2 className="report-section-title">四柱排盘</h2>
        <table className="report-table">
          <thead>
            <tr>
              {pillars.map(p => <th key={p.label}>{p.label}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              {pillars.map(p => <td key={p.label} style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>{p.gan}</td>)}
            </tr>
            <tr>
              {pillars.map(p => <td key={p.label} style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>{p.zhi}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* 五行分析 */}
      {chartData?.wuxing && (
        <div className="report-section">
          <h2 className="report-section-title">五行分析</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {Object.entries(chartData.wuxing).map(([key, val]: [string, any]) => (
              <div key={key} className="report-card" style={{ flex: '1', minWidth: '100px' }}>
                <div className="report-card-title">{key}</div>
                <div className="report-card-text">数量：{val.count} · 力量：{val.strength || val.percentage || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 基础解读 */}
      {interpretation && (
        <div className="report-section">
          <h2 className="report-section-title">命理分析</h2>
          {interpretation.summary && (
            <p className="report-section-text">{interpretation.summary}</p>
          )}
          {interpretation.personality && (
            <div className="report-card">
              <div className="report-card-title">性格特点</div>
              <div className="report-card-text">{interpretation.personality}</div>
            </div>
          )}
          {interpretation.career && (
            <div className="report-card">
              <div className="report-card-title">事业分析</div>
              <div className="report-card-text">{interpretation.career}</div>
            </div>
          )}
          {interpretation.wealth && (
            <div className="report-card">
              <div className="report-card-title">财运分析</div>
              <div className="report-card-text">{interpretation.wealth}</div>
            </div>
          )}
          {interpretation.marriage && (
            <div className="report-card">
              <div className="report-card-title">婚姻感情</div>
              <div className="report-card-text">{interpretation.marriage}</div>
            </div>
          )}
        </div>
      )}

      {/* 深度分析 */}
      {detailedAnalysis && (
        <div className="report-section">
          <h2 className="report-section-title">深度命理分析</h2>
          {detailedAnalysis.career && (
            <div className="report-card">
              <div className="report-card-title">事业深度分析</div>
              <div className="report-card-text">
                {detailedAnalysis.career.analysis || JSON.stringify(detailedAnalysis.career).slice(0, 500)}
              </div>
            </div>
          )}
          {detailedAnalysis.wealth && (
            <div className="report-card">
              <div className="report-card-title">财运深度分析</div>
              <div className="report-card-text">
                {detailedAnalysis.wealth.analysis || JSON.stringify(detailedAnalysis.wealth).slice(0, 500)}
              </div>
            </div>
          )}
          {detailedAnalysis.marriage && (
            <div className="report-card">
              <div className="report-card-title">婚姻深度分析</div>
              <div className="report-card-text">
                {detailedAnalysis.marriage.analysis || JSON.stringify(detailedAnalysis.marriage).slice(0, 500)}
              </div>
            </div>
          )}
          {detailedAnalysis.health && (
            <div className="report-card">
              <div className="report-card-title">健康分析</div>
              <div className="report-card-text">
                {detailedAnalysis.health.analysis || JSON.stringify(detailedAnalysis.health).slice(0, 500)}
              </div>
            </div>
          )}
          {detailedAnalysis.overview && (
            <div className="report-card">
              <div className="report-card-title">一生综述</div>
              <div className="report-card-text">{detailedAnalysis.overview}</div>
            </div>
          )}
        </div>
      )}

      {/* 大运 */}
      {chartData?.dayun && Array.isArray(chartData.dayun) && chartData.dayun.length > 0 && (
        <div className="report-section">
          <h2 className="report-section-title">大运排列</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>起始年龄</th>
                <th>天干</th>
                <th>地支</th>
                <th>十神</th>
              </tr>
            </thead>
            <tbody>
              {chartData.dayun.slice(0, 8).map((dy: any, i: number) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center' }}>{dy.startAge || dy.age || '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dy.gan || '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dy.zhi || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{dy.shishen || dy.tenGod || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ZiweiReport({ report }: { report: any }) {
  const { interpretation, detailedAnalysis } = report;
  return (
    <>
      {interpretation?.summary && (
        <div className="report-section">
          <h2 className="report-section-title">命盘总评</h2>
          <p className="report-section-text">{interpretation.summary}</p>
        </div>
      )}
      {interpretation?.mainStarAnalysis && (
        <div className="report-section">
          <h2 className="report-section-title">主星分析</h2>
          {Array.isArray(interpretation.mainStarAnalysis) ? (
            interpretation.mainStarAnalysis.map((s: any, i: number) => (
              <div key={i} className="report-card">
                <div className="report-card-title">{s.star || s.name}</div>
                <div className="report-card-text">{s.analysis || s.meaning || JSON.stringify(s).slice(0, 300)}</div>
              </div>
            ))
          ) : (
            <p className="report-section-text">{JSON.stringify(interpretation.mainStarAnalysis).slice(0, 500)}</p>
          )}
        </div>
      )}
      {detailedAnalysis && (
        <div className="report-section">
          <h2 className="report-section-title">深度分析</h2>
          {detailedAnalysis.overallAnalysis && (
            <div className="report-card">
              <div className="report-card-title">命盘深度总评</div>
              <div className="report-card-text">{detailedAnalysis.overallAnalysis}</div>
            </div>
          )}
          {detailedAnalysis.patternDetails && Array.isArray(detailedAnalysis.patternDetails) && (
            <div className="report-card">
              <div className="report-card-title">格局分析</div>
              <div className="report-card-text">
                {detailedAnalysis.patternDetails.map((p: any, i: number) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    <strong>{p.name}</strong>：{p.analysis || p.meaning || ''}
                  </div>
                ))}
              </div>
            </div>
          )}
          {detailedAnalysis.sihuaOverview && (
            <div className="report-card">
              <div className="report-card-title">四化飞星总论</div>
              <div className="report-card-text">{JSON.stringify(detailedAnalysis.sihuaOverview).slice(0, 500)}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function QimenReport({ report }: { report: any }) {
  const { chartData, interpretation, detailedAnalysis } = report;
  return (
    <>
      {chartData?.dunType && (
        <div className="report-section">
          <h2 className="report-section-title">起局信息</h2>
          <div className="report-card">
            <div className="report-card-text">
              {chartData.dunType} · 第{chartData.juNumber}局
            </div>
          </div>
        </div>
      )}
      {interpretation?.summary && (
        <div className="report-section">
          <h2 className="report-section-title">格局分析</h2>
          <p className="report-section-text">{interpretation.summary}</p>
        </div>
      )}
      {detailedAnalysis && (
        <div className="report-section">
          <h2 className="report-section-title">深度断局</h2>
          {detailedAnalysis.yongshenAnalysis && (
            <div className="report-card">
              <div className="report-card-title">用神分析</div>
              <div className="report-card-text">
                {detailedAnalysis.yongshenAnalysis.analysis || JSON.stringify(detailedAnalysis.yongshenAnalysis).slice(0, 500)}
              </div>
            </div>
          )}
          {detailedAnalysis.patternDetails && Array.isArray(detailedAnalysis.patternDetails) && (
            <div className="report-card">
              <div className="report-card-title">格局深度分析</div>
              <div className="report-card-text">
                {detailedAnalysis.patternDetails.map((p: any, i: number) => (
                  <div key={i} style={{ marginBottom: '6px' }}>
                    <strong>{p.name}</strong>：{p.meaning || p.analysis || ''}
                  </div>
                ))}
              </div>
            </div>
          )}
          {detailedAnalysis.overallAnalysis && (
            <div className="report-card">
              <div className="report-card-title">综合断局</div>
              <div className="report-card-text">{detailedAnalysis.overallAnalysis}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function MeihuaReport({ report }: { report: any }) {
  const { chartData, interpretation, detailedAnalysis } = report;
  return (
    <>
      {chartData?.benGua && (
        <div className="report-section">
          <h2 className="report-section-title">卦象信息</h2>
          <table className="report-table">
            <tbody>
              <tr><th>本卦</th><td>{chartData.benGua}</td></tr>
              <tr><th>互卦</th><td>{chartData.huGua || '-'}</td></tr>
              <tr><th>变卦</th><td>{chartData.bianGua || '-'}</td></tr>
              <tr><th>体用关系</th><td>{chartData.tiYong || '-'}</td></tr>
              <tr><th>动爻</th><td>第{chartData.dongYao}爻</td></tr>
            </tbody>
          </table>
        </div>
      )}
      {interpretation?.summary && (
        <div className="report-section">
          <h2 className="report-section-title">综合断卦</h2>
          <p className="report-section-text">{interpretation.summary}</p>
        </div>
      )}
      {detailedAnalysis && (
        <div className="report-section">
          <h2 className="report-section-title">深度分析</h2>
          {detailedAnalysis.tiYongAnalysis && (
            <div className="report-card">
              <div className="report-card-title">体用分析</div>
              <div className="report-card-text">
                {detailedAnalysis.tiYongAnalysis.analysis || JSON.stringify(detailedAnalysis.tiYongAnalysis).slice(0, 500)}
              </div>
            </div>
          )}
          {detailedAnalysis.guaEvolution && (
            <div className="report-card">
              <div className="report-card-title">卦象演变</div>
              <div className="report-card-text">{JSON.stringify(detailedAnalysis.guaEvolution).slice(0, 500)}</div>
            </div>
          )}
          {detailedAnalysis.domainAnalysis && (
            <div className="report-card">
              <div className="report-card-title">分领域断语</div>
              <div className="report-card-text">{JSON.stringify(detailedAnalysis.domainAnalysis).slice(0, 500)}</div>
            </div>
          )}
          {detailedAnalysis.overallAnalysis && (
            <div className="report-card">
              <div className="report-card-title">综合断卦</div>
              <div className="report-card-text">{detailedAnalysis.overallAnalysis}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
