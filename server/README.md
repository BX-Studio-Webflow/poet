# Poet Server

A Next.js API server for Poet that integrates with Workday Recruiting to provide job listings data.

## Reference

- [Features](#features)
- [API Endpoints](#api-endpoints)
  - [GET /api/jobs](#get-apijobs)
- [Workday Integration](#workday-integration)
- [CORS Configuration](#cors-configuration)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Pre-defined Scripts](#pre-defined-scripts)
- [Deployment](#deployment)

## Features

- **Workday Integration**: Fetches job postings from Workday Recruiting v4 API via OAuth 2.0
- **RESTful API**: Clean endpoints for job data
- **CORS Support**: Configured for Webflow and local development
- **Type-Safe**: Full TypeScript types for API responses

## API Endpoints

### GET /api/jobs

Returns job postings from Workday Recruiting (transformed to a unified format).

**Request:**

```
GET /api/jobs
```

**Response:**

```json
[
  {
    "id": 1,
    "title": "Software Engineer",
    "postedDate": "2026-01-19T18:02:13+00:00",
    "location": {
      "city": "",
      "state": "",
      "label": "San Francisco, CA",
      "address": { "line1": "", "line2": null, "city": "", "state": "", "zipcode": "", "country": "" }
    },
    "department": "Engineering",
    "status": { "id": 1, "label": "Open" },
    "hiringLead": { "name": "", "avatar": "" },
    "applicants": { "new": 0, "active": 0, "total": 0 },
    "postingUrl": "https://..."
  }
]
```

## Workday Integration

The server integrates with Workday Recruiting v4 REST API:

**Endpoints:**

- **Token**: `POST {WORKDAY_BASE_URL}/oauth2/{WORKDAY_TENANT}/token`
- **Job Postings**: `GET {WORKDAY_BASE_URL}/api/recruiting/v4/{WORKDAY_TENANT}/jobPostings`

**Authentication (OAuth 2.0):**

1. Request access token with `grant_type=refresh_token` and `refresh_token`
2. Use `Authorization: Basic {client_id:client_secret}` on token request
3. Use `Authorization: Bearer {access_token}` on job postings request

**Docs:** [Workday Recruiting v4 - Job Postings](https://community.workday.com/sites/default/files/file-hosting/restapi/#recruiting/v4/jobPostings)

## CORS Configuration

CORS is configured in `src/middleware.ts` for the following origins:

```typescript
const acceptedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://larson-air-conditioning.webflow.io',
  'https://chaloner.com',
  'https://www.chaloner.com',
];
```

**Note:** Origins must NOT have trailing slashes.

## Environment Variables

Copy `.env.example` to `.env` and fill in your Workday credentials:

```bash
cp .env.example .env
```

| Variable                 | Description                          | Required |
| ------------------------ | ------------------------------------ | -------- |
| `WORKDAY_BASE_URL`       | Workday API base (e.g. `https://wd2-impl-services1.workday.com/ccx`) | ✅       |
| `WORKDAY_TENANT`         | Tenant name (e.g. `poet_preview`)    | ✅       |
| `WORKDAY_CLIENT_ID`      | OAuth client ID                      | ✅       |
| `WORKDAY_CLIENT_SECRET`   | OAuth client secret                   | ✅       |
| `WORKDAY_REFRESH_TOKEN`   | OAuth refresh token                  | ✅       |

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The server runs at [http://localhost:8000](http://localhost:8000).

### Production Build

```bash
pnpm build
pnpm start
```

## Pre-defined Scripts

| Script          | Description                              |
| --------------- | ---------------------------------------- |
| `pnpm dev`      | Start development server with hot reload |
| `pnpm build`    | Build for production                     |
| `pnpm start`    | Start production server                  |
| `pnpm lint`     | Run ESLint                               |
| `pnpm lint:fix` | Fix auto-fixable ESLint issues           |

## Response Format

The `/api/jobs` endpoint returns the raw Workday API response (e.g. `{ data: [...], total?: number }`). The client interprets Workday fields directly.

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `WORKDAY_BASE_URL`, `WORKDAY_TENANT`, `WORKDAY_CLIENT_ID`, `WORKDAY_CLIENT_SECRET`, `WORKDAY_REFRESH_TOKEN`
3. Deploy

### Other Platforms

Build and run:

```bash
pnpm build
pnpm start
```

Ensure the `API_KEY` environment variable is set in your hosting platform.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [BambooHR API Documentation](https://documentation.bamboohr.com/reference)
- [Vercel Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
