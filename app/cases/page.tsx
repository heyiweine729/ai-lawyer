'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, ChevronRight, Trash2 } from 'lucide-react';
import { CASE_STATUS_MAP } from '@/types';
import type { CaseStatus } from '@/types';

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchCases = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    fetch(`/api/cases?${params}`)
      .then((r) => r.json())
      .then((d) => { setCases(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除案件「${name}」吗？此操作不可撤销。`)) return;
    await fetch(`/api/cases/${id}`, { method: 'DELETE' });
    fetchCases();
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <input
              className="input pl-9 text-sm"
              placeholder="搜索案件名称、案号…"
              style={{ width: 280 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input text-sm"
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="preparing">准备中</option>
            <option value="trial">审理中</option>
            <option value="closed">已结案</option>
          </select>
        </div>
        <Link href="/cases/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> 新建案件
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <div
          className="grid gap-4 px-5 py-3 text-xs font-medium border-b"
          style={{
            gridTemplateColumns: '2.5fr 1fr 1fr 1fr 0.8fr 60px',
            color: 'var(--text-tertiary)',
            borderColor: 'var(--border-light)',
            background: 'var(--surface-secondary)',
          }}
        >
          <span>案件名称</span>
          <span>类型</span>
          <span>状态</span>
          <span>标的金额</span>
          <span>更新时间</span>
          <span />
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>加载中...</div>
        ) : cases.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>还没有案件</p>
            <Link href="/cases/new" className="btn btn-primary btn-sm mt-3 inline-flex">
              <Plus className="w-4 h-4" /> 创建第一个案件
            </Link>
          </div>
        ) : (
          cases.map((c: any) => {
            const status = CASE_STATUS_MAP[c.status as CaseStatus] || { label: c.status, color: 'gray' };
            return (
              <div
                key={c.id}
                className="grid gap-4 px-5 py-4 items-center text-sm border-b last:border-b-0 transition-colors hover:bg-[var(--surface-secondary)]"
                style={{
                  gridTemplateColumns: '2.5fr 1fr 1fr 1fr 0.8fr 60px',
                  borderColor: 'var(--border-light)',
                }}
              >
                <Link href={`/cases/${c.id}`}>
                  <div className="font-medium hover:underline">{c.name}</div>
                  {c.caseNumber && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{c.caseNumber}</div>
                  )}
                </Link>
                <span style={{ color: 'var(--text-secondary)' }}>{c.caseType}</span>
                <span><span className={`status-badge ${status.color}`}>{status.label}</span></span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {c.amount ? `¥${(c.amount / 10000).toFixed(0)}万` : '-'}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(c.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-1">
                  <Link href={`/cases/${c.id}`}>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-1 rounded hover:bg-red-50"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
