'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Keyboard, Loader2, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { CASE_TYPE_OPTIONS } from '@/types';

type InputMode = 'transcript' | 'file' | 'manual';
type Step = 1 | 2 | 3 | 4;

// 解析中文金额字符串，如 "150万元" → 1500000, "19.8万" → 198000, "1500000" → 1500000
function parseAmount(str: string): number | undefined {
  if (!str) return undefined;
  const cleaned = str.replace(/[,，元人民币约大概]/g, '').trim();
  const wanMatch = cleaned.match(/([\d.]+)\s*万/);
  if (wanMatch) {
    return parseFloat(wanMatch[1]) * 10000 || undefined;
  }
  const yiMatch = cleaned.match(/([\d.]+)\s*亿/);
  if (yiMatch) {
    return parseFloat(yiMatch[1]) * 100000000 || undefined;
  }
  const num = parseFloat(cleaned.replace(/[^\d.]/g, ''));
  return isNaN(num) ? undefined : num;
}

interface AnalysisResult {
  caseType: string;
  parties: { name: string; role: string; description: string }[];
  keyFacts: { date: string; fact: string }[];
  disputes: string[];
  amount: string;
  summary: string;
  missingInfo: { question: string; reason: string }[];
  preliminaryAnalysis: string;
}

export default function NewCasePage() {
  const [step, setStep] = useState<Step>(1);
  const [inputMode, setInputMode] = useState<InputMode>('transcript');
  const [transcriptText, setTranscriptText] = useState('');
  const [manualText, setManualText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [supplement, setSupplement] = useState('');

  // 案件基本信息
  const [caseName, setCaseName] = useState('');
  const [caseType, setCaseType] = useState('');

  // 调用 AI 分析
  const handleAnalyze = useCallback(async () => {
    const content = inputMode === 'transcript' ? transcriptText : manualText;
    if (!content.trim()) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mode: inputMode }),
      });
      const data = await res.json();
      setAnalysis(data);
      setCaseType(data.caseType || '');
      setCaseName(data.summary?.slice(0, 30) || '新案件');
      setStep(2);
    } catch (err) {
      console.error('分析失败:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [transcriptText, manualText, inputMode]);

  // 提交创建案件
  const handleCreate = async () => {
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: caseName || '新案件',
          caseType: caseType || '其他',
          description: analysis?.summary || supplement || '',
          amount: analysis?.amount ? parseAmount(analysis.amount) : undefined,
          status: 'preparing',
          aiAnalysis: analysis ? JSON.stringify(analysis) : undefined,
          parties: (analysis?.parties || []).map((p: any) => ({
            name: p.name,
            role: p.role,
          })),
        }),
      });
      if (res.ok) {
        const newCase = await res.json();
        window.location.href = `/cases/${newCase.id}`;
      } else {
        alert('创建失败，请重试');
      }
    } catch (err) {
      console.error(err);
      alert('创建失败，请重试');
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* 步骤指示器 */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { num: 1, label: '导入案情' },
          { num: 2, label: 'AI 分析' },
          { num: 3, label: '补充信息' },
          { num: 4, label: '确认建档' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                style={{
                  background: step >= s.num ? 'var(--brand-500)' : 'var(--surface-tertiary)',
                  color: step >= s.num ? 'white' : 'var(--text-tertiary)',
                }}
              >
                {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
              </div>
              <span
                className="text-sm"
                style={{
                  color: step >= s.num ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: step === s.num ? 500 : 400,
                }}
              >
                {s.label}
              </span>
            </div>
            {i < 3 && (
              <div
                className="w-8 h-px"
                style={{ background: step > s.num ? 'var(--brand-500)' : 'var(--border-light)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 导入案情材料 */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="card">
            <h3 className="text-base font-semibold mb-4">选择录入方式</h3>

            {/* 模式切换 */}
            <div className="flex gap-2 mb-5">
              {[
                { mode: 'transcript' as InputMode, icon: Upload, label: '录音文本' },
                { mode: 'file' as InputMode, icon: FileText, label: '文件上传' },
                { mode: 'manual' as InputMode, icon: Keyboard, label: '手动输入' },
              ].map((m) => (
                <button
                  key={m.mode}
                  className="btn btn-sm"
                  style={{
                    background: inputMode === m.mode ? 'var(--brand-50)' : 'transparent',
                    color: inputMode === m.mode ? 'var(--brand-600)' : 'var(--text-secondary)',
                    borderColor: inputMode === m.mode ? 'var(--brand-200)' : 'var(--border-default)',
                  }}
                  onClick={() => setInputMode(m.mode)}
                >
                  <m.icon className="w-4 h-4" /> {m.label}
                </button>
              ))}
            </div>

            {/* 录音文本模式 */}
            {inputMode === 'transcript' && (
              <div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  粘贴钉钉智能录音的转写文本，AI 将自动识别发言人、提取关键事实、生成案情摘要。
                </p>
                <textarea
                  className="input"
                  rows={12}
                  placeholder={`粘贴录音转写文本，例如：\n\n[律师] 你好张先生，请详细说说你和李某之间的合同纠纷。\n[当事人 张某] 我们是2023年8月签的购销合同，约定他11月之前交货...\n[律师] 合同里违约金条款是怎么写的？\n[当事人 张某] 写的是按合同总金额的30%赔偿...`}
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                />
                <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                  支持钉钉、飞书、讯飞等录音转写格式，也支持纯文本对话
                </div>
              </div>
            )}

            {/* 文件上传模式 */}
            {inputMode === 'file' && (
              <div
                className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-[var(--brand-400)]"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm font-medium mb-1">拖拽文件到此处，或点击上传</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  支持 .txt .doc .docx .pdf 格式，单个文件最大 10MB
                </p>
              </div>
            )}

            {/* 手动输入模式 */}
            {inputMode === 'manual' && (
              <div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  直接描述案情，AI 将帮你整理并分析。
                </p>
                <textarea
                  className="input"
                  rows={10}
                  placeholder="请描述案件的基本情况，包括：当事人、事件经过、争议焦点、诉求等..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              disabled={isAnalyzing || (inputMode === 'transcript' ? !transcriptText.trim() : !manualText.trim())}
              onClick={handleAnalyze}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> AI 分析中...
                </>
              ) : (
                <>
                  开始 AI 分析 <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: AI 分析结果 */}
      {step === 2 && analysis && (
        <div className="space-y-5">
          {/* 分析结果卡片 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">AI 案情分析结果</h3>
              <span className="status-badge green">分析完成</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-secondary)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>案由</div>
                <div className="text-sm font-medium">{analysis.caseType}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-secondary)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>涉案金额</div>
                <div className="text-sm font-medium">{analysis.amount || '待确认'}</div>
              </div>
            </div>

            {/* 当事人 */}
            <div className="mb-4">
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>当事人</div>
              <div className="space-y-2">
                {(analysis.parties || []).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={`status-badge ${p.role === 'plaintiff' ? 'amber' : p.role === 'defendant' ? 'blue' : 'gray'}`}>
                      {p.role === 'plaintiff' ? '原告' : p.role === 'defendant' ? '被告' : '第三人'}
                    </span>
                    <span className="font-medium">{p.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 争议焦点 */}
            <div className="mb-4">
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>争议焦点</div>
              <div className="space-y-1">
                {(analysis.disputes || []).map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* 案情摘要 */}
            <div className="mb-4">
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>案情摘要</div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {analysis.summary}
              </p>
            </div>

            {/* 初步分析 */}
            <div
              className="rounded-lg p-4 border"
              style={{ borderColor: 'var(--brand-200)', background: 'var(--brand-50)' }}
            >
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--brand-600)' }}>
                AI 初步法律分析
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-700)' }}>
                {analysis.preliminaryAnalysis}
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <button className="btn" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" /> 返回修改
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              下一步：补充信息 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: AI 追问 + 律师补充 */}
      {step === 3 && analysis && (
        <div className="space-y-5">
          {/* AI 追问 */}
          <div
            className="card"
            style={{ borderColor: 'var(--brand-200)', borderWidth: 2 }}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--brand-600)' }}>
              AI 追问：缺失的关键信息
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              回答以下问题可以让案情分析更准确，也可以跳过
            </p>

            <div className="space-y-4">
              {(analysis.missingInfo || []).map((q, i) => (
                <div key={i} className="pb-4 border-b last:border-b-0" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="text-sm mb-1 font-medium">
                    {i + 1}. {q.question}
                  </div>
                  <div className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    {q.reason}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="input text-sm"
                      placeholder="输入回答…"
                      value={answers[i] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                    />
                    <button className="btn btn-sm btn-primary shrink-0">确认</button>
                    <button className="btn btn-sm btn-ghost shrink-0">跳过</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 自由补充 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">律师自由补充</h3>
            <textarea
              className="input"
              rows={4}
              placeholder="补充 AI 未提取到的案情信息、你的判断和策略思路…"
              value={supplement}
              onChange={(e) => setSupplement(e.target.value)}
            />
          </div>

          <div className="flex justify-between">
            <button className="btn" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" /> 返回查看
            </button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>
              下一步：确认建档 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 确认建档 */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="card">
            <h3 className="text-base font-semibold mb-4">确认案件信息</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  案件名称
                </label>
                <input
                  className="input text-sm"
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  案件类型
                </label>
                <select
                  className="input text-sm"
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                >
                  <option value="">请选择</option>
                  {CASE_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  案号（选填）
                </label>
                <input className="input text-sm" placeholder="如：(2024)京民初XXX号" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  管辖法院（选填）
                </label>
                <input className="input text-sm" placeholder="如：北京市朝阳区人民法院" />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button className="btn" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4" /> 返回修改
            </button>
            <button className="btn btn-primary" onClick={handleCreate}>
              <CheckCircle className="w-4 h-4" /> 确认建档
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
