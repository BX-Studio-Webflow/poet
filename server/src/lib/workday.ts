/**
 * Workday OAuth2 and API utilities
 * Docs: https://community.workday.com/sites/default/files/file-hosting/restapi/#recruiting/v4/jobPostings
 */

export interface WorkdayTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Request a new access token using the refresh token grant type
 */
export async function getWorkdayAccessToken(): Promise<string> {
  const baseUrl = process.env.WORKDAY_BASE_URL;
  const tenant = process.env.WORKDAY_TENANT;
  const clientId = process.env.WORKDAY_CLIENT_ID;
  const clientSecret = process.env.WORKDAY_CLIENT_SECRET;
  const refreshToken = process.env.WORKDAY_REFRESH_TOKEN;

  if (!baseUrl || !tenant || !clientId || !clientSecret || !refreshToken) {
    const missing = [
      !baseUrl && 'WORKDAY_BASE_URL',
      !tenant && 'WORKDAY_TENANT',
      !clientId && 'WORKDAY_CLIENT_ID',
      !clientSecret && 'WORKDAY_CLIENT_SECRET',
      !refreshToken && 'WORKDAY_REFRESH_TOKEN',
    ].filter(Boolean);
    throw new Error(`Missing Workday env: ${missing.join(', ')}`);
  }

  const tokenUrl = `${baseUrl.replace(/\/$/, '')}/oauth2/${tenant}/token`;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Workday token error ${response.status}: ${text}`);
  }

  const data: WorkdayTokenResponse = await response.json();

  // Workday may rotate the refresh token - store the new one if returned
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    console.warn(
      '[Workday] New refresh token received. Update WORKDAY_REFRESH_TOKEN in your .env to avoid future auth issues.'
    );
  }

  return data.access_token;
}

const JOB_POSTINGS_PAGE_SIZE = 100;
/** Guard if offset is ignored and the same page repeats */
const MAX_JOB_POSTING_PAGES = 100;

interface WorkdayJobPostingsPage {
  total?: number;
  data?: unknown[];
  hasMore?: boolean;
}

/**
 * Fetch job postings from Workday Recruiting v4 API.
 * Workday returns `total` for all matches but only one page in `data` unless
 * you paginate with limit/offset (see REST collection pattern).
 */
export async function fetchWorkdayJobPostings(accessToken: string): Promise<unknown> {
  const baseUrl = process.env.WORKDAY_BASE_URL;
  const tenant = process.env.WORKDAY_TENANT;

  if (!baseUrl || !tenant) {
    throw new Error('Missing WORKDAY_BASE_URL or WORKDAY_TENANT');
  }

  const base = `${baseUrl.replace(/\/$/, '')}/api/recruiting/v4/${tenant}/jobPostings`;

  const allData: unknown[] = [];
  let total: number | undefined;
  let offset = 0;
  let previousFirstId: string | undefined;
  let page = 0;

  while (page < MAX_JOB_POSTING_PAGES) {
    const url = new URL(base);
    url.searchParams.set('limit', String(JOB_POSTINGS_PAGE_SIZE));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Workday jobPostings error ${response.status}: ${text}`);
    }

    const body = (await response.json()) as WorkdayJobPostingsPage;
    const batch = Array.isArray(body.data) ? body.data : [];

    if (typeof body.total === 'number') {
      total = body.total;
    }

    if (batch.length === 0) {
      break;
    }

    const firstId =
      batch[0] && typeof batch[0] === 'object' && batch[0] !== null && 'id' in batch[0]
        ? String((batch[0] as { id: unknown }).id)
        : undefined;
    if (offset > 0 && firstId !== undefined && firstId === previousFirstId) {
      console.warn(
        '[Workday] jobPostings pagination: offset appears ignored; returning first page only. Check API query params.'
      );
      break;
    }
    previousFirstId = firstId;

    allData.push(...batch);
    page += 1;

    if (body.hasMore === false) {
      break;
    }
    if (total !== undefined && allData.length >= total) {
      break;
    }
    if (batch.length < JOB_POSTINGS_PAGE_SIZE) {
      break;
    }

    offset += JOB_POSTINGS_PAGE_SIZE;
  }

  return {
    total: total ?? allData.length,
    data: allData,
  };
}
