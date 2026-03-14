'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileText,
  MessageSquare,
  Clock,
  ArrowRight,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { CASE_STATUS_MAP } from '@/types';
import type { CaseStatus } from '@/types';

interface DashboardData {
  active: number;
  preparing: number;
  trial: number;
  closed: number;
  total: number;
  draftDocs: number;
  recentCases: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = [
    { label: '进行中案件', value: data?.active || 0, icon: Briefcase, color: 'var(--brand-500)' },
    { label: '准备中', value: data?.preparing || 0, icon: TrendingUp, color: 'var(--success)' },
    { label: '待处理文书', value: data?.draftDocs || 0, icon: FileText, color: 'var(--warning)' },
    { label: '已结案', value: data?.closed || 0, icon: Clock, color: 'var(--text-tertiary)' },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">工作台</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          共 {data?.total || 0} 个案件
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${stat.color}15` }}
            >
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                {stat.label}
              </div>
              <div className="text-2xl font-semibold">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* 最近案件 */}
        <div className="col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">最近案件</h3>
            <Link href="/cases" className="text-xs flex items-center gap-1" style={{ color: 'var(--brand-500)' }}>
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>加载中...</div>
          ) : (data?.recentCases?.length || 0) === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>还没有案件</p>
              <Link href="/cases/new" className="btn btn-primary btn-sm mt-3 inline-flex">
                <Plus className="w-4 h-4" /> 创建第一个案件
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {data?.recentCases.map((c: any) => {
                const status = CASE_STATUS_MAP[c.status as CaseStatus] || { label: c.status, color: 'gray' };
                return (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                  >
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {c.caseType} · {new Date(c.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </div>
                    </div>
                    <span className={`status-badge ${status.color}`}>{status.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 右侧 */}
        <div className="col-span-2 space-y-5">
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">AI 快速咨询</h3>
            <div className="rounded-lg p-3 mb-3 text-sm leading-relaxed" style={{ background: 'var(--surface-secondary)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>AI 助手</div>
              你好！我可以帮你分析案情、查找法条、起草文书。
            </div>
            <Link href="/chat" className="btn btn-primary btn-sm w-full">开始对话</Link>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold mb-3">快捷操作</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/cases/new" className="btn btn-sm justify-start"><Plus className="w-4 h-4" /> 新建案件</Link>
              <Link href="/documents/new" className="btn btn-sm justify-start"><FileText className="w-4 h-4" /> 生成文书</Link>
              <Link href="/chat" className="btn btn-sm justify-start"><MessageSquare className="w-4 h-4" /> AI 对话</Link>
              <Link href="/documents" className="btn btn-sm justify-start"><Briefcase className="w-4 h-4" /> 模板库</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
