import { NextRequest } from 'next/server';
import { getCases, createCase } from '@/lib/actions';

export const dynamic = 'force-dynamic';

// GET /api/cases - 获取案件列表
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search') || undefined;
  const status = req.nextUrl.searchParams.get('status') || undefined;

  try {
    const cases = await getCases({ search, status });
    return Response.json(cases);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/cases - 创建案件
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newCase = await createCase(body);
    return Response.json(newCase, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
