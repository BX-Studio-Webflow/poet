/**
 * Workday Recruiting v4 API response types
 * Matches: GET /api/recruiting/v4/{tenant}/jobPostings
 */

export interface WorkdayJobPosting {
  id: string;
  title: string;
  url: string;
  startDate: string;
  jobDescription?: string;
  jobType?: { id: string; descriptor: string };
  jobSite?: { id: string; descriptor: string };
  primaryLocation?: {
    id: string;
    descriptor: string;
    country?: { descriptor: string; alpha3Code: string };
    region?: { descriptor: string; code: string };
  };
  categories?: { id: string; descriptor: string }[];
  company?: { id: string; descriptor: string };
  timeType?: { id: string; descriptor: string };
  spotlightJob?: boolean;
}

export interface WorkdayJobPostingsResponse {
  total: number;
  data: WorkdayJobPosting[];
}
