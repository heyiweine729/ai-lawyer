import { NextRequest } from 'next/server';
import { getChatSessions, createChatSession } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessions = await getChatSessions();
    return Response.json(sessions);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await createChatSession(body);
    return Response.json(session, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
