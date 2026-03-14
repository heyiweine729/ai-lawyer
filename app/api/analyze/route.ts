import { NextRequest } from 'next/server';
import { kimi, KIMI_MODEL, SYSTEM_PROMPTS } from '@/lib/kimi';

// 从 AI 返回的文本中提取 JSON
function extractJSON(text: string): any {
  // 1. 尝试直接解析
  try {
    return JSON.parse(text.trim());
  } catch {}

  // 2. 移除 markdown 代码块标记
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // 3. 尝试找到第一个 { 和最后一个 } 之间的内容
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

// 确保返回的数据包含所有必要字段
function normalizeAnalysis(data: any): any {
  return {
    caseType: data?.caseType || data?.case_type || data?.caseCategory || '待确认',
    parties: Array.isArray(data?.parties) ? data.parties : [],
    keyFacts: Array.isArray(data?.keyFacts) ? data.keyFacts : Array.isArray(data?.key_facts) ? data.key_facts : [],
    disputes: Array.isArray(data?.disputes) ? data.disputes : Array.isArray(data?.dispute_points) ? data.dispute_points : [],
    amount: data?.amount || data?.caseAmount || '',
    summary: data?.summary || data?.caseSummary || data?.case_summary || '',
    missingInfo: Array.isArray(data?.missingInfo) ? data.missingInfo : Array.isArray(data?.missing_info) ? data.missing_info : [],
    preliminaryAnalysis: data?.preliminaryAnalysis || data?.preliminary_analysis || data?.analysis || '',
  };
}

export async function POST(req: NextRequest) {
  try {
    const { content, mode } = await req.json();

    const userPrompt =
      mode === 'transcript'
        ? `以下是律师与当事人的对话录音转写文本，请进行分析：\n\n${content}`
        : `以下是案件的基本描述，请进行分析：\n\n${content}`;

    console.log('[Analyze API] Sending request to Kimi...');

    const response = await kimi.chat.completions.create({
      model: KIMI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.analyzeTranscript },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    const text = response.choices[0]?.message?.content || '';
    console.log('[Analyze API] Raw response length:', text.length);
    console.log('[Analyze API] Raw response preview:', text.slice(0, 500));

    const parsed = extractJSON(text);

    if (parsed) {
      console.log('[Analyze API] JSON parsed successfully');
      return Response.json(normalizeAnalysis(parsed));
    }

    console.log('[Analyze API] JSON parse failed, using fallback');
    return Response.json({
      caseType: '待确认',
      parties: [],
      keyFacts: [],
      disputes: [],
      amount: '',
      summary: text.slice(0, 1000),
      missingInfo: [
        { question: '请提供更详细的案件信息', reason: 'AI 返回了分析但格式不是预期的结构化数据' },
      ],
      preliminaryAnalysis: text.length > 1000 ? text.slice(1000, 2000) : '请查看案情摘要中的分析内容。',
    });
  } catch (error: any) {
    console.error('[Analyze API] Error:', error);
    return Response.json({
      caseType: '分析失败',
      parties: [],
      keyFacts: [],
      disputes: [],
      amount: '',
      summary: '请求出错：' + (error.message || '未知错误') + '。请检查 API Key 配置是否正确。',
      missingInfo: [],
      preliminaryAnalysis: '',
    });
  }
}
