import { BambooHRJob, TransformedJob } from '@/types/jobs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const REVALIDATE_SECONDS = 12 * 60 * 60; // 12 hours

// BambooHR API Gateway URL (not the web interface URL)
const BAMBOOHR_API_URL =
  'https://api.bamboohr.com/api/gateway.php/larsonairaz/v1/applicant_tracking/jobs';

export async function GET() {
  try {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error('API_KEY environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const baseURL = new URL(BAMBOOHR_API_URL);
    baseURL.searchParams.append('statusGroups', 'Open');
    baseURL.searchParams.append('sortBy', 'status');
    baseURL.searchParams.append('sortOrder', 'DESC');

    // Basic Auth: username = API_KEY, password = "x" (BambooHR convention)
    const basicAuth = Buffer.from(`${apiKey}:x`).toString('base64');

    const response = await fetch(baseURL.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`BambooHR API error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jobs: BambooHRJob[] = await response.json();

    return NextResponse.json(restructureJobsData(jobs));
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

function restructureJobsData(jobs: BambooHRJob[]): TransformedJob[] {
  return jobs.map((job) => ({
    id: job.id,
    title: job.title.label ?? 'Untitled Position',
    postedDate: job.postedDate,
    location: {
      city: job.location.address.city,
      state: job.location.address.state,
      label: job.location.label,
      address: {
        line1: job.location.address.addressLine1,
        line2: job.location.address.addressLine2,
        city: job.location.address.city,
        state: job.location.address.state,
        zipcode: job.location.address.zipcode,
        country: job.location.address.country,
      },
    },
    department: job.department.label ?? 'General',
    status: {
      id: job.status.id,
      label: job.status.label,
    },
    hiringLead: {
      name: `${job.hiringLead.firstName} ${job.hiringLead.lastName}`,
      avatar: job.hiringLead.avatar,
    },
    applicants: {
      new: job.newApplicantsCount,
      active: job.activeApplicantsCount,
      total: job.totalApplicantsCount,
    },
    postingUrl: job.postingUrl,
  }));
}
