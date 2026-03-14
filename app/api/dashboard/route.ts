import { getDashboardStats } from '@/lib/actions';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return Response.json(stats);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
