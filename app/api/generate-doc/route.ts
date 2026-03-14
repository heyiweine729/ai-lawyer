import { NextRequest } from 'next/server';
import { kimi, KIMI_MODEL, SYSTEM_PROMPTS, } from '@/lib/kimi';
import { DOC_TYPE_MAP } from '@/types';
import type { DocumentType } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { type, caseDescription } = await req.json();
    const docType = type as DocumentType;
    const typeLabel = DOC_TYPE_MAP[docType]?.label || '法律文书';

    const response = await kimi.chat.completions.create({
      model: KIMI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.generateDocument },
        {
          role: 'user',
          content: `请根据以下案件信息，生成一份规范的【${typeLabel}】：\n\n${caseDescription}`,
        },
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 8192,
    });

    // SSE 流
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Generate doc API error:', error);
    return Response.json(
      { error: error.message || '生成失败' },
      { status: 500 }
    );
  }
}
