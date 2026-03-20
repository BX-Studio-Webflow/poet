# Larson Server

A Next.js API server for Larson Air Conditioning that integrates with BambooHR's Applicant Tracking System to provide job listings data.

## Reference

- [Features](#features)
- [API Endpoints](#api-endpoints)
  - [GET /api/jobs](#get-apijobs)
  - [GET /api/jobs/[id]](#get-apijobsid)
  - [POST /api/jobs/[id]/apply](#post-apijobsidapply)
- [BambooHR Integration](#bamboohr-integration)
- [CORS Configuration](#cors-configuration)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Pre-defined Scripts](#pre-defined-scripts)
- [Deployment](#deployment)

## Features

- **BambooHR Integration**: Fetches job listings from BambooHR Applicant Tracking API
- **RESTful API**: Clean endpoints for job data
- **CORS Support**: Configured for Webflow and local development
- **Type-Safe**: Full TypeScript types for BambooHR response data

## API Endpoints

### GET /api/jobs

Returns all open job listings from BambooHR.

**Request:**

```
GET /api/jobs
```

**Response:**

```json
[
  {
    "id": 47,
    "title": "Installation Coordinator (HVAC)",
    "postedDate": "2026-01-19T18:02:13+00:00",
    "location": {
      "city": "Scottsdale",
      "state": "Arizona",
      "label": "Scottsdale, Arizona",
      "address": {
        "line1": "7363 E Adobe Dr",
        "line2": "101",
        "city": "Scottsdale",
        "state": "Arizona",
        "zipcode": "85255",
        "country": "United States"
      }
    },
    "department": "Install",
    "status": {
      "id": 1,
      "label": "Open"
    },
    "hiringLead": {
      "name": "Joshua Sanders",
      "avatar": "https://..."
    },
    "applicants": {
      "new": 7,
      "active": 7,
      "total": 10
    },
    "postingUrl": "https://larsonairaz.bamboohr.com/jobs/view.php?id=47"
  }
]
```

**Query Parameters (passed to BambooHR):**

- `statusGroups=Open` - Only fetch open positions
- `sortBy=status` - Sort by job status
- `sortOrder=DESC` - Descending order

### GET /api/jobs/[id]

Returns a single job by ID.

### POST /api/jobs/[id]/apply

Submit a job application (forwards to BambooHR).

## BambooHR Integration

The server integrates with BambooHR's Applicant Tracking API:

**API Endpoint:**

```
https://api.bamboohr.com/api/gateway.php/larsonairaz/v1/applicant_tracking/jobs
```

**Authentication:**

- Uses Basic Auth
- Username: `API_KEY` from environment
- Password: `x` (BambooHR convention)

**Data Transformation:**

The raw BambooHR response is transformed to a cleaner format:

| BambooHR Field                    | Transformed Field    |
| --------------------------------- | -------------------- |
| `title.label`                     | `title`              |
| `location.label`                  | `location.label`     |
| `location.address.*`              | `location.address.*` |
| `department.label`                | `department`         |
| `status.id`, `status.label`       | `status`             |
| `hiringLead.firstName + lastName` | `hiringLead.name`    |
| `hiringLead.avatar`               | `hiringLead.avatar`  |
| `newApplicantsCount`              | `applicants.new`     |
| `activeApplicantsCount`           | `applicants.active`  |
| `totalApplicantsCount`            | `applicants.total`   |
| `postingUrl`                      | `postingUrl`         |

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

Create a `.env` file in the project root:

```env
API_KEY=your_bamboohr_api_key_here
```

| Variable  | Description                         | Required |
| --------- | ----------------------------------- | -------- |
| `API_KEY` | BambooHR API key for authentication | ✅       |

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

## Type Definitions

Types are defined in `src/types/jobs/index.ts`:

- `BambooHRJob` - Raw API response type
- `LabeledField` - Generic `{ id, label }` type
- `JobLocation` - Location with address details
- `JobStatus` - Status enum (Open, Filled, On Hold, Canceled, Draft)
- `HiringLead` - Employee info for hiring lead
- `TransformedJob` - Clean API response type

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `API_KEY` = Your BambooHR API key
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
