'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit3, MessageSquare, FileText,
  Clock, Users, CalendarDays, Loader2,
} from 'lucide-react';
import { CASE_STATUS_MAP } from '@/types';
import type { CaseStatus } from '@/types';

export default function CaseDetailPage() {
  const params = useParams();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cases/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setCaseData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
      </div>
    );
  }

  if (!caseData || caseData.error) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>案件不存在</p>
        <Link href="/cases" className="btn btn-sm mt-3 inline-flex">返回案件列表</Link>
      </div>
    );
  }

  const status = CASE_STATUS_MAP[caseData.status as CaseStatus] || { label: caseData.status, color: 'gray' };
  const aiAnalysis = caseData.aiAnalysis ? JSON.parse(caseData.aiAnalysis) : null;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/cases" className="btn btn-ghost btn-sm"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h2 className="text-base font-semibold">{caseData.name}</h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {caseData.caseNumber || '暂无案号'} · {caseData.court || '暂未指定法院'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/chat`} className="btn btn-sm"><MessageSquare className="w-4 h-4" /> AI 分析</Link>
          <Link href={`/documents/new`} className="btn btn-sm"><FileText className="w-4 h-4" /> 生成文书</Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          {/* 基本信息 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">案件信息</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>案由</span>
                <span>{caseData.caseType}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>状态</span>
                <span className={`status-badge ${status.color}`}>{status.label}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>标的金额</span>
                <span className="font-medium">
                  {caseData.amount && caseData.amount > 0
                    ? `¥${caseData.amount >= 10000 ? (caseData.amount / 10000).toFixed(1) + '万' : caseData.amount.toLocaleString()}`
                    : '待确认'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>创建时间</span>
                <span>{new Date(caseData.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          </div>

          {/* 案情摘要 */}
          {caseData.description && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">案情摘要</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {caseData.description}
              </p>
            </div>
          )}

          {/* AI 分析 */}
          {aiAnalysis && (
            <div className="card" style={{ borderColor: 'var(--brand-200)', borderWidth: '1px' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--brand-600)' }}>AI 分析记录</h3>

              {aiAnalysis.disputes?.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>争议焦点</div>
                  {aiAnalysis.disputes.map((d: string, i: number) => (
                    <div key={i} className="text-sm mb-1">• {d}</div>
                  ))}
                </div>
              )}

              {aiAnalysis.preliminaryAnalysis && (
                <div className="rounded-lg p-3" style={{ background: 'var(--brand-50)' }}>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--brand-600)' }}>初步法律分析</div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-700)' }}>
                    {aiAnalysis.preliminaryAnalysis}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 当事人 */}
          {caseData.parties?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3"><Users className="w-4 h-4 inline mr-1" /> 当事人</h3>
              <div className="space-y-3">
                {caseData.parties.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 text-sm">
                    <span className={`status-badge ${p.role === 'plaintiff' ? 'amber' : p.role === 'defendant' ? 'blue' : 'gray'}`}>
                      {p.role === 'plaintiff' ? '原告' : p.role === 'defendant' ? '被告' : '第三人'}
                    </span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧 */}
        <div className="space-y-5">
          {/* 时间线 */}
          {caseData.timeline?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-4"><Clock className="w-4 h-4 inline mr-1" /> 时间线</h3>
              <div className="space-y-0">
                {caseData.timeline.map((event: any, i: number) => (
                  <div key={event.id} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: i === 0 ? 'var(--brand-500)' : 'var(--border-default)' }} />
                      {i < caseData.timeline.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ background: 'var(--border-light)' }} />
                      )}
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(event.date).toLocaleDateString('zh-CN')}
                      </div>
                      <div className="text-sm mt-0.5">{event.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 相关文书 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3"><FileText className="w-4 h-4 inline mr-1" /> 相关文书</h3>
            {caseData.documents?.length > 0 ? (
              caseData.documents.map((doc: any) => (
                <div key={doc.id} className="text-sm py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border-light)' }}>
                  {doc.title}
                </div>
              ))
            ) : (
              <div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>暂无文书</p>
                <Link href="/documents/new" className="btn btn-sm btn-primary w-full">
                  <FileText className="w-4 h-4" /> 生成文书
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
