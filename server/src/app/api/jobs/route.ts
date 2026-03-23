import { fetchWorkdayJobPostings, getWorkdayAccessToken } from '@/lib/workday';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const accessToken = await getWorkdayAccessToken();
    const data = await fetchWorkdayJobPostings(accessToken);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
