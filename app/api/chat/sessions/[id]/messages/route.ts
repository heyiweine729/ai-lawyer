import { NextRequest } from 'next/server';
import { getChatMessages, addChatMessage } from '@/lib/actions';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await getChatMessages(params.id);
    return Response.json(messages);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const message = await addChatMessage({
      sessionId: params.id,
      role: body.role,
      content: body.content,
    });
    return Response.json(message, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
