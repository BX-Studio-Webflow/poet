# Poet

A monorepo for the Poet careers website, featuring a dynamic job board integrated with BambooHR and Webflow.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Webflow Site                           │
│                  (your-site.webflow.io)                     │
│                           │                                 │
│                    <script> tag                             │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       client                                │
│              (CDN-hosted JavaScript)                         │
│                                                             │
│  • JobBoardController                                       │
│  • Featured jobs (4 most recent)                             │
│  • Department filtering                                     │
│  • Pagination (5 per page)                                  │
└───────────────────────────┼─────────────────────────────────┘
                            │ fetch()
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       server                                │
│                 (Next.js API / Vercel)                      │
│                                                             │
│  • /api/jobs endpoint                                       │
│  • CORS middleware                                          │
│  • Data transformation                                      │
└───────────────────────────┼─────────────────────────────────┘
                            │ Basic Auth
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      BambooHR API                           │
│          (Applicant Tracking System)                        │
└─────────────────────────────────────────────────────────────┘
```

## Packages

| Package            | Description                       | Tech Stack          |
| ------------------ | --------------------------------- | ------------------- |
| [client](./client) | Webflow-integrated client library | TypeScript, esbuild |
| [server](./server) | API server for job data           | Next.js, TypeScript |

## Features

### Job Board

- **BambooHR Integration**: Real-time job listings from BambooHR ATS
- **Featured Jobs**: 4 most recent postings displayed prominently
- **Department Filtering**: Dynamic filters based on active departments
- **Pagination**: 5 jobs per page with navigation controls
- **Webflow Compatible**: Uses `dev-target` attributes for DOM manipulation

### API

- **RESTful Endpoints**: Clean JSON API for job data
- **CORS Configured**: Supports Webflow and local development
- **Type-Safe**: Full TypeScript types throughout

## HTML Structure

The job board client uses `dev-role` and `dev-target` attributes to find and populate DOM elements. Place these attributes on your Webflow elements as shown below.

### Required Attributes Reference

| Attribute                           | Element                     | Required |
| ----------------------------------- | --------------------------- | -------- |
| `dev-role="job-container"`          | Main job board wrapper      | ✅       |
| `dev-role="job-filters-wrapper"`    | Filter buttons container    | ✅       |
| `dev-role="job-pagination-wrapper"` | Pagination controls wrapper | ✅       |
| `dev-target="job-list"`             | Job cards `<ul>` container  | ✅       |
| `dev-target="one-job-card"`         | Job card template `<li>`    | ✅       |
| `dev-role="job-title"`              | Job title heading           | ✅       |
| `dev-role="job-desc"`               | Job description (location)  | ✅       |
| `dev-target="job-category"`         | Department pill             | ✅       |
| `dev-target="job-cta"`              | Apply button `<a>`          | ✅       |
| `dev-target="job-filter-tag"`       | Filter button template      | ✅       |
| `dev-target="job-filter-text"`      | Filter button text          | ✅       |
| `dev-target="btn-prev"`             | Previous page button        | ✅       |
| `dev-target="btn-next"`             | Next page button            | ✅       |
| `dev-target="page-btn-template"`    | Page number button template | ✅       |

### Optional (Featured Jobs)

| Attribute                            | Element                        |
| ------------------------------------ | ------------------------------ |
| `dev-target="job-list-featured"`     | Featured jobs `<ul>` container |
| `dev-target="featured-job-card"`     | Featured job card template     |
| `dev-target="featured-job-title"`    | Featured job title             |
| `dev-target="featured-job-desc"`     | Featured job location          |
| `dev-target="featured-job-category"` | Featured job department        |
| `dev-target="featured-job-cta"`      | Featured job apply button      |

### Complete HTML Structure

```html
<!-- Main container - REQUIRED -->
<div dev-role="job-container">
  <!-- Featured jobs section - OPTIONAL (4 most recent jobs) -->
  <ul dev-target="job-list-featured" class="wrapper--job-list">
    <li dev-target="featured-job-card" class="card--job-post">
      <h3 dev-target="featured-job-title">Job Title</h3>
      <div dev-target="featured-job-category">Department</div>
      <p dev-target="featured-job-desc">Location</p>
      <a dev-target="featured-job-cta" href="#">Apply now</a>
    </li>
  </ul>

  <!-- Filter buttons - REQUIRED -->
  <div dev-role="job-filters-wrapper">
    <button dev-target="job-filter-tag" class="job-filter is-active">
      <div dev-target="job-filter-text">View all</div>
    </button>
  </div>

  <!-- Main job list - REQUIRED -->
  <ul dev-target="job-list" class="wrapper--job-list">
    <li dev-target="one-job-card" class="card--job-post">
      <h3 dev-role="job-title">Job Title</h3>
      <div dev-target="job-category">Department</div>
      <p dev-role="job-desc">Location</p>
      <a dev-target="job-cta" href="#">Apply now</a>
    </li>
  </ul>

  <!-- Pagination - REQUIRED -->
  <div dev-role="job-pagination-wrapper">
    <button dev-target="btn-prev">← Previous</button>
    <div class="wrapper--page-buttons">
      <button dev-target="page-btn-template">1</button>
    </div>
    <button dev-target="btn-next">Next →</button>
  </div>
</div>
```

### Behavior Notes

- **Templates**: `one-job-card`, `featured-job-card`, `job-filter-tag`, and `page-btn-template` are cloned; the first instance is used as the template and its content is replaced.
- **Classes**: The script toggles `is-active` on filters and page buttons, `is-disabled` on prev/next when at bounds, and `hide` on pagination when jobs ≤ 5.
- **Page button template**: Must be inside a parent wrapper; the script clears the wrapper and injects page number buttons.
- **Refresh**: Call `window.refreshJobBoard()` to manually reload jobs from the API.

## Reference

- [Quick Start](#quick-start)
- [Included tools](#included-tools)
- [Requirements](#requirements)
- [Getting started](#getting-started)
  - [Installing](#installing)
  - [Building](#building)
    - [Serving files on development mode](#serving-files-on-development-mode)
    - [Building multiple files](#building-multiple-files)
    - [Setting up a path alias](#setting-up-a-path-alias)
- [Contributing guide](#contributing-guide)
- [Pre-defined scripts](#pre-defined-scripts)
- [CI/CD](#cicd)
  - [Continuous Integration](#continuous-integration)
  - [Continuous Deployment](#continuous-deployment)
  - [How to automatically deploy updates to npm](#how-to-automatically-deploy-updates-to-npm)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Create `server/.env`:

```env
API_KEY=your_bamboohr_api_key
```

### 3. Start Development Servers

**Option A - Run both client and server:**

```bash
pnpm dev
# Client: http://localhost:3000
# Server: http://localhost:8000
```

**Option B - Run separately:**

```bash
# Terminal 1 - API Server
pnpm dev:server
# Runs at http://localhost:8000

# Terminal 2 - Client
pnpm dev:frontend
# Serves at http://localhost:3000
```

### 4. Add Script to Webflow

```html
<script defer src="http://localhost:3000/index.js"></script>
```

### 5. Dev Mode (Local API)

When developing locally, set `devMode` in localStorage so the client uses the local API:

```javascript
localStorage.setItem('devMode', 'true');
```

## Included tools

This project contains preconfigured development tools:

- [TypeScript](https://www.typescriptlang.org/): Type-safe development across client and server.
- [Next.js](https://nextjs.org/): React framework for the API server.
- [esbuild](https://esbuild.github.io/): Fast JavaScript bundler for client code.
- [Playwright](https://playwright.dev/): Fast and reliable end-to-end testing.
- [ESLint](https://eslint.org/): Code linting and quality enforcement.
- [Prettier](https://prettier.io/): Code formatting for consistency.
- [Changesets](https://github.com/changesets/changesets): Version management and changelog generation.
- [Finsweet's TypeScript Utils](https://github.com/finsweet/ts-utils): Webflow development utilities.

## Requirements

This project requires:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.js.org/) - Install with:

```bash
npm i -g pnpm
```

- [BambooHR API Key](https://documentation.bamboohr.com/docs/getting-started) - For job listings

## Getting started

### Installing

Clone the repository and install dependencies:

```bash
pnpm install
```

If this is the first time using Playwright and you want to use it in this project, you'll also have to install the browsers by running:

```bash
pnpm playwright install
```

It is also recommended that you install the following extensions in your VSCode editor:

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

### Environment Setup

Create environment files for the server:

```bash
# server/.env
API_KEY=your_bamboohr_api_key
```

### Building

To run the development servers:

**Client** (Webflow JavaScript):

```bash
pnpm dev:frontend
# or: cd client && pnpm dev
# Development server at localhost:3000
```

**Server** (Next.js API):

```bash
pnpm dev:server
# or: cd server && pnpm dev
# API server at localhost:8000
```

### Production Builds

```bash
# Client - outputs to client/dist/
pnpm build:frontend

# Server - outputs to server/.next/
pnpm build:server

# Or build both
pnpm build
```

## Testing

This project uses [Playwright](https://playwright.dev/) for end-to-end testing.

**Run Tests:**

```bash
pnpm test              # Run Playwright tests headless
pnpm test:headed       # Run tests with browser UI
```

Tests are located in:

- `client/tests/` - Client E2E tests

## Contributing guide

Development workflow:

1. Create a new branch for your feature or bug fix.
2. Make your changes with proper TypeScript types.
3. Run `pnpm lint` and `pnpm test` to ensure code quality.
4. Create a Changeset: `pnpm changeset` (select packages, bump type, and describe changes).
5. Commit your code and the changeset file, then push.
6. Open a Pull Request and wait for CI checks to pass.
7. After merging, Changesets will create a "Version Packages" PR.
8. Review and merge the version PR to update `CHANGELOG.md` and bump versions.

## Pre-defined scripts

**Root level:**

| Script                   | Description                                 |
| ------------------------ | ------------------------------------------- |
| `pnpm lint`              | Scan codebase for linting errors            |
| `pnpm lint:fix`          | Fix auto-fixable linting issues             |
| `pnpm format`            | Format code with Prettier                   |
| `pnpm test`              | Run all Playwright tests                    |
| `pnpm test:headed`       | Run Playwright tests with browser UI        |
| `pnpm changeset`         | Create a new changeset for version tracking |
| `pnpm changeset version` | Bump versions from changesets               |

**client:**

| Script       | Description                                        |
| ------------ | -------------------------------------------------- |
| `pnpm dev`   | Start dev server with hot reload at localhost:3000 |
| `pnpm build` | Build to `dist/` for production                    |
| `pnpm check` | TypeScript type checking                           |

**server:**

| Script       | Description                                |
| ------------ | ------------------------------------------ |
| `pnpm dev`   | Start Next.js dev server at localhost:8000 |
| `pnpm build` | Build for production                       |
| `pnpm start` | Start production server                    |

## CI/CD

This template contains a set of helpers with proper CI/CD workflows.

### Continuous Integration

When you open a Pull Request, a Continuous Integration workflow will run to:

- Lint & check your code using `pnpm lint` and `pnpm check`
- Run the automated tests using `pnpm test`

If any of these jobs fail, you will get a warning in your Pull Request and should try to fix your code accordingly.

### Continuous Deployment

[Changesets](https://github.com/changesets/changesets) manages versioning and changelogs when merging to `main`.

**Creating a changeset:**

```bash
pnpm changeset
```

You'll select which packages changed, the version bump type (major/minor/patch), and describe the changes.

**Workflow:**

1. Merge PR with changeset to `main`
2. Changesets bot creates a "Version Packages" PR automatically
3. Review and merge the version PR to update `CHANGELOG.md` and bump versions
4. Deploy:
   - **Client**: Tag release and update CDN URL in Webflow
   - **Server**: Deploy to Vercel (automatic on push to main)

### Client Deployment

After creating a version:

```bash
git tag v0.0.1
git push origin v0.0.1
```

Update the script tag in Webflow:

```html
<script src="https://cdn.jsdelivr.net/gh/your-org/poet@v0.0.1/client/dist/index.js"></script>
```

### Server Deployment

The server auto-deploys to Vercel on push to `main`. Ensure environment variables are set in Vercel dashboard:

- `API_KEY` - BambooHR API key

#### Enabling Changesets Permissions

Some repositories may not have the required permissions for Changesets.

Go to repository settings (`Settings > Actions > General > Workflow Permissions`) and enable:

- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests
