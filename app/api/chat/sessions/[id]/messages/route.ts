import { NextRequest } from 'next/server';
import { getChatMessages, addChatMessage } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await getChatMessages(id);
    return Response.json(messages);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const message = await addChatMessage({
      sessionId: id,
      role: body.role,
      content: body.content,
    });
    return Response.json(message, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
