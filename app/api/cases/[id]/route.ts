import { NextRequest } from 'next/server';
import { getCaseById, updateCase, deleteCase } from '@/lib/actions';

// GET /api/cases/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseData = await getCaseById(params.id);
    if (!caseData) {
      return Response.json({ error: '案件不存在' }, { status: 404 });
    }
    return Response.json(caseData);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/cases/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await updateCase(params.id, body);
    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/cases/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCase(params.id);
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
