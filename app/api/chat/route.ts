import { NextRequest } from 'next/server';
import { kimi, KIMI_MODEL, SYSTEM_PROMPTS } from '@/lib/kimi';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await kimi.chat.completions.create({
      model: KIMI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.general },
        ...messages,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    });

    // 转换为 SSE 流
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
    console.error('Chat API error:', error);
    return Response.json(
      { error: error.message || '请求失败' },
      { status: 500 }
    );
  }
}
