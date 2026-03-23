import { getWorkdayAccessToken } from '@/lib/workday';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/token
 * Returns a fresh Workday access token for testing.
 * Use: Authorization: Bearer <token> when calling /api/jobs or Workday directly.
 */
export async function GET() {
  try {
    const accessToken = await getWorkdayAccessToken();
    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
  }
}
