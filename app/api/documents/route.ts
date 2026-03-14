import { NextRequest } from 'next/server';
import { getDocuments, createDocument } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const caseId = req.nextUrl.searchParams.get('caseId') || undefined;
  try {
    const docs = await getDocuments({ caseId });
    return Response.json(docs);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const doc = await createDocument(body);
    return Response.json(doc, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
