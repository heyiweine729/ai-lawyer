'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Download, Save, ArrowLeft, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { DOC_TYPE_MAP } from '@/types';
import type { DocumentType } from '@/types';

function NewDocumentPage()  {
  const searchParams = useSearchParams();
  const docType = (searchParams.get('type') || 'complaint') as DocumentType;
  const typeInfo = DOC_TYPE_MAP[docType];

  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');

  // 加载案件列表
  useEffect(() => {
    fetch('/api/cases')
      .then((r) => r.json())
      .then((d) => setCases(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // 选择案件后自动填充案情描述
  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
    if (!caseId) return;
    const selected = cases.find((c) => c.id === caseId);
    if (selected) {
      let desc = selected.description || '';
      if (selected.parties?.length > 0) {
        const partiesStr = selected.parties
          .map((p: any) => `${p.role === 'plaintiff' ? '原告' : p.role === 'defendant' ? '被告' : '第三人'}：${p.name}`)
          .join('，');
        desc = `当事人：${partiesStr}\n案由：${selected.caseType}\n${selected.amount ? `标的金额：${selected.amount}元\n` : ''}\n${desc}`;
      }
      setCaseDescription(desc);
    }
  };

  // 调用 AI 生成文书
  const handleGenerate = async () => {
    if (!caseDescription.trim()) return;
    setIsGenerating(true);
    setContent('');

    try {
      const res = await fetch('/api/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: docType,
          caseDescription,
        }),
      });

      // 流式读取
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content || '';
              accumulated += text;
              setContent(accumulated);
            } catch {
              // skip
            }
          }
        }
      }
    } catch (err) {
      console.error('生成失败:', err);
      setContent('生成失败，请检查 API 配置后重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  // 导出 Word
  const handleExportWord = async () => {
    if (!content) return;
    try {
      const docxModule = await import('docx');
      const { Document, Packer, Paragraph, TextRun, AlignmentType } = docxModule;

      // 将文本按行解析为段落
      const lines = content.split('\n');
      const children: InstanceType<typeof Paragraph>[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          children.push(new Paragraph({ text: '' }));
          continue;
        }

        // 检测标题行
        const isCenterTitle = /^(民事|刑事|行政)?(起诉状|答辩状|上诉状|律师函|法律意见书|合同审查报告)/.test(trimmed);
        const isSectionTitle = /^[一二三四五六七八九十]+[、.]/.test(trimmed);

        if (isCenterTitle) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed, bold: true, size: 36 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400, before: 400 },
            })
          );
        } else if (isSectionTitle) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed, bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            })
          );
        } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed, size: 24 })],
              spacing: { line: 360 },
              indent: { firstLine: 480 },
            })
          );
        }
      }

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
            },
          },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `${typeInfo.label}_${new Date().toISOString().slice(0, 10)}.docx`;

      // 使用原生方式下载，不依赖 file-saver
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出失败:', err);
      // 降级方案：导出为纯文本
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${typeInfo.label}_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/documents" className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-2xl">{typeInfo.icon}</span>
          <div>
            <h2 className="text-base font-semibold">生成{typeInfo.label}</h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              AI 将根据案情自动生成文书内容
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={handleExportWord} disabled={!content}>
            <Download className="w-4 h-4" /> 导出 Word
          </button>
          <button className="btn btn-primary btn-sm" disabled={!content}>
            <Save className="w-4 h-4" /> 保存
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* 左侧：案情输入 */}
        <div className="col-span-2 space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">案件信息</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  选择已有案件（可选）
                </label>
                <select
                  className="input text-sm"
                  value={selectedCaseId}
                  onChange={(e) => handleCaseSelect(e.target.value)}
                >
                  <option value="">不关联案件，手动输入</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  案情描述
                </label>
                <textarea
                  className="input"
                  rows={8}
                  placeholder={`请描述案件基本信息，包括：\n• 原告、被告信息\n• 事实经过\n• 诉讼请求\n• 法律依据\n\nAI 会据此生成规范的${typeInfo.label}。`}
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary w-full"
                disabled={isGenerating || !caseDescription.trim()}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> AI 生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> AI 生成{typeInfo.label}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 提示卡片 */}
          <div
            className="rounded-lg p-4 border text-xs leading-relaxed"
            style={{
              borderColor: 'var(--brand-200)',
              background: 'var(--brand-50)',
              color: 'var(--brand-700)',
            }}
          >
            <div className="font-medium mb-1">提示</div>
            提供的案件信息越详细，AI 生成的文书质量越高。建议包含当事人完整信息、具体时间、金额和关键证据。
          </div>
        </div>

        {/* 右侧：文书预览编辑 */}
        <div className="col-span-3">
          <div className="card min-h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">文书内容</h3>
              {content && (
                <span className="status-badge green">
                  {isGenerating ? '生成中...' : '生成完成'}
                </span>
              )}
            </div>

            {!content && !isGenerating ? (
              <div
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <span className="text-4xl mb-4">{typeInfo.icon}</span>
                <p className="text-sm font-medium mb-1">
                  {typeInfo.label}将在这里生成
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  填写左侧案件信息后点击生成
                </p>
              </div>
            ) : (
              <div>
                <textarea
                  className="w-full border-0 outline-none resize-none text-sm leading-[2]"
                  style={{
                    minHeight: 520,
                    fontFamily: '"Noto Serif SC", "Songti SC", serif',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                  }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  readOnly={isGenerating}
                />
                {isGenerating && <span className="typing-cursor" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>加载中...</div>}>
      <NewDocumentPage />
    </Suspense>
  );
}