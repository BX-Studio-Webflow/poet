import { fetchWorkdayJobPostings, getWorkdayAccessToken } from '@/lib/workday';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

/** 12 hours — Data Cache + route segment (no per-request Workday calls until stale) */
const REVALIDATE_SECONDS = 12 * 60 * 60;

export const revalidate = REVALIDATE_SECONDS;

const getCachedJobPostings = unstable_cache(
  async () => {
    const accessToken = await getWorkdayAccessToken();
    return fetchWorkdayJobPostings(accessToken);
  },
  ['workday-job-postings'],
  { revalidate: REVALIDATE_SECONDS }
);

export async function GET() {
  try {
    const data = await getCachedJobPostings();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
