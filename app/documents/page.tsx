'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, ChevronRight, Clock } from 'lucide-react';
import { DOC_TYPE_MAP } from '@/types';
import type { DocumentType } from '@/types';

const TEMPLATES: { type: DocumentType; desc: string; tag: string }[] = [
  { type: 'complaint',       desc: '向法院提起民事诉讼',   tag: '最常用' },
  { type: 'defense',         desc: '被告方提交答辩意见',   tag: '被告使用' },
  { type: 'lawyer_letter',   desc: '催告、警告、交涉',     tag: '催告/警告' },
  { type: 'opinion',         desc: '出具专业法律意见',     tag: '咨询意见' },
  { type: 'contract_review', desc: '审查合同风险点',       tag: '风险标注' },
  { type: 'appeal',          desc: '不服一审判决上诉',     tag: '二审使用' },
];

const MOCK_DOCS = [
  { id: '1', title: '张某诉李某买卖合同纠纷起诉状', type: 'complaint' as DocumentType, status: 'final', caseName: '张某诉李某合同纠纷案', updatedAt: '3月12日' },
  { id: '2', title: '王某某劳动仲裁申请书', type: 'complaint' as DocumentType, status: 'draft', caseName: '王某某劳动争议案', updatedAt: '3月11日' },
  { id: '3', title: '致李某律师函', type: 'lawyer_letter' as DocumentType, status: 'final', caseName: '张某诉李某合同纠纷案', updatedAt: '3月9日' },
];

export default function DocumentsPage() {
  const [tab, setTab] = useState<'templates' | 'my'>('templates');
  const [search, setSearch] = useState('');

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Tab 切换 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-secondary)' }}>
          <button
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              background: tab === 'templates' ? 'var(--surface-primary)' : 'transparent',
              color: tab === 'templates' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: tab === 'templates' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
            onClick={() => setTab('templates')}
          >
            文书模板
          </button>
          <button
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              background: tab === 'my' ? 'var(--surface-primary)' : 'transparent',
              color: tab === 'my' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: tab === 'my' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
            onClick={() => setTab('my')}
          >
            我的文书
          </button>
        </div>

        {tab === 'my' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <input
              className="input pl-9 text-sm"
              placeholder="搜索文书…"
              style={{ width: 240 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* 模板库 */}
      {tab === 'templates' && (
        <div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            选择模板后，AI 将根据案件信息自动生成文书内容，你可以在线编辑和导出。
          </p>
          <div className="grid grid-cols-3 gap-4">
            {TEMPLATES.map((t) => {
              const info = DOC_TYPE_MAP[t.type];
              return (
                <Link
                  key={t.type}
                  href={`/documents/new?type=${t.type}`}
                  className="card group cursor-pointer flex flex-col items-center text-center py-6 transition-all hover:border-[var(--brand-400)]"
                >
                  <span className="text-3xl mb-3">{info.icon}</span>
                  <div className="text-sm font-semibold mb-1">{info.label}</div>
                  <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {t.desc}
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--surface-secondary)', color: 'var(--text-tertiary)' }}
                  >
                    {t.tag}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 我的文书 */}
      {tab === 'my' && (
        <div className="card p-0 overflow-hidden">
          <div
            className="grid gap-4 px-5 py-3 text-xs font-medium border-b"
            style={{
              gridTemplateColumns: '2.5fr 1fr 1fr 1fr 40px',
              color: 'var(--text-tertiary)',
              borderColor: 'var(--border-light)',
              background: 'var(--surface-secondary)',
            }}
          >
            <span>文书标题</span>
            <span>类型</span>
            <span>关联案件</span>
            <span>更新时间</span>
            <span />
          </div>

          {MOCK_DOCS.map((doc) => {
            const info = DOC_TYPE_MAP[doc.type];
            return (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="grid gap-4 px-5 py-4 items-center text-sm border-b last:border-b-0 transition-colors hover:bg-[var(--surface-secondary)]"
                style={{
                  gridTemplateColumns: '2.5fr 1fr 1fr 1fr 40px',
                  borderColor: 'var(--border-light)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span>{info.icon}</span>
                  <div>
                    <div className="font-medium">{doc.title}</div>
                    <span
                      className={`status-badge ${doc.status === 'final' ? 'green' : 'gray'} mt-1`}
                    >
                      {doc.status === 'final' ? '已定稿' : '草稿'}
                    </span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>{info.label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{doc.caseName}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{doc.updatedAt}</span>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
