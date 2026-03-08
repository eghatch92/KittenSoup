import { NextResponse } from 'next/server';
import { getPublicStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        totalAnalyses: 0,
        leaderboard: [],
      },
      { status: 200 },
    );
  }
}
