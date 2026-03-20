# Larson Client

A Webflow-integrated client library for Larson Air Conditioning, providing dynamic job board functionality with filtering, pagination, and featured listings.

Before starting to work with this template, please take some time to read through the documentation.

## Reference

- [Features](#features)
- [Job Board System](#job-board-system)
  - [How It Works](#how-it-works)
  - [DOM Attributes Reference](#dom-attributes-reference)
  - [Featured Jobs Section](#featured-jobs-section)
  - [Main Job Listing](#main-job-listing)
  - [Filtering](#filtering)
  - [Pagination](#pagination)
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

## Features

- **Dynamic Job Board**: Fetches job listings from BambooHR API via the larson-server
- **Featured Jobs**: Displays 4 most recent job postings sorted by date
- **Department Filtering**: Dynamic filter buttons for each department with active jobs
- **Pagination**: 5 jobs per page with prev/next navigation
- **Webflow Integration**: Uses `dev-target` attributes for reliable DOM selection

## Job Board System

The job board (`JobBoardController`) is a fully client-side system that integrates with Webflow pages using `dev-target` and `dev-role` attributes for DOM manipulation.

### How It Works

1. **Initialization**: When the page loads, the controller queries for required DOM elements
2. **Data Fetching**: Jobs are fetched from the API endpoint (`/api/jobs`)
3. **Rendering**: Featured jobs, filters, and paginated job listings are rendered
4. **Interactivity**: Users can filter by department and navigate pages

### DOM Attributes Reference

All DOM manipulation relies exclusively on `dev-target` and `dev-role` attributes. If any required attribute is missing, the controller logs an error and exits gracefully.

#### Container Elements

| Attribute                           | Element                     | Required |
| ----------------------------------- | --------------------------- | -------- |
| `dev-role="job-container"`          | Main job board wrapper      | ✅       |
| `dev-role="job-filters-wrapper"`    | Filter buttons container    | ✅       |
| `dev-role="job-pagination-wrapper"` | Pagination controls wrapper | ✅       |

#### Job List Elements

| Attribute                   | Element                                  | Required |
| --------------------------- | ---------------------------------------- | -------- |
| `dev-target="job-list"`     | Job cards `<ul>` container               | ✅       |
| `dev-target="one-job-card"` | Job card template `<li>`                 | ✅       |
| `dev-role="job-title"`      | Job title heading                        | ✅       |
| `dev-role="job-desc"`       | Job description (shows `location.label`) | ✅       |
| `dev-target="job-category"` | Department pill                          | ✅       |
| `dev-target="job-cta"`      | Apply button `<a>`                       | ✅       |

#### Filter Elements

| Attribute                      | Element                | Required |
| ------------------------------ | ---------------------- | -------- |
| `dev-target="job-filter-tag"`  | Filter button template | ✅       |
| `dev-target="job-filter-text"` | Filter button text     | ✅       |

#### Pagination Elements

| Attribute                        | Element                     | Required |
| -------------------------------- | --------------------------- | -------- |
| `dev-target="btn-prev"`          | Previous page button        | ✅       |
| `dev-target="btn-next"`          | Next page button            | ✅       |
| `dev-target="page-btn-template"` | Page number button template | ✅       |

#### Featured Jobs Elements (Optional)

| Attribute                            | Element                        | Required |
| ------------------------------------ | ------------------------------ | -------- |
| `dev-target="job-list-featured"`     | Featured jobs `<ul>` container | ❌       |
| `dev-target="featured-job-card"`     | Featured job card template     | ❌       |
| `dev-target="featured-job-title"`    | Featured job title             | ❌       |
| `dev-target="featured-job-desc"`     | Featured job location          | ❌       |
| `dev-target="featured-job-category"` | Featured job department        | ❌       |
| `dev-target="featured-job-cta"`      | Featured job apply button      | ❌       |

### Featured Jobs Section

Displays the **4 most recent** job postings sorted by `postedDate` (newest first).

```html
<ul dev-target="job-list-featured" class="wrapper--job-list">
  <li dev-target="featured-job-card" class="card--job-post">
    <h3 dev-target="featured-job-title">Job Title</h3>
    <div dev-target="featured-job-category">Department</div>
    <p dev-target="featured-job-desc">Location</p>
    <a dev-target="featured-job-cta" href="#">Apply now</a>
  </li>
</ul>
```

**Behavior:**

- Automatically renders if elements exist on the page
- Skips silently if featured elements are not present
- Jobs open in a new tab when clicking "Apply"

### Main Job Listing

Displays all jobs with pagination (5 per page).

```html
<ul dev-target="job-list" class="wrapper--job-list">
  <li dev-target="one-job-card" class="card--job-post">
    <h3 dev-role="job-title">Job Title</h3>
    <div dev-target="job-category">Department</div>
    <p dev-role="job-desc">Location</p>
    <a dev-target="job-cta" href="#">Apply now</a>
  </li>
</ul>
```

### Filtering

Filters are dynamically generated based on departments that have at least one active job.

```html
<div dev-role="job-filters-wrapper">
  <button dev-target="job-filter-tag" class="job-filter is-active">
    <div dev-target="job-filter-text">View all</div>
  </button>
</div>
```

**Behavior:**

- "View all" filter shows all jobs
- Department filters only show jobs in that department
- Active filter receives `is-active` class
- Only one filter can be active at a time
- Changing filter resets to page 1

### Pagination

```html
<div dev-role="job-pagination-wrapper">
  <button dev-target="btn-prev">←</button>
  <div class="wrapper--page-buttons">
    <button dev-target="page-btn-template">1</button>
  </div>
  <button dev-target="btn-next">→</button>
</div>
```

**Behavior:**

- Shows 5 jobs per page
- Hidden when total jobs ≤ 5 (adds `hide` class)
- Prev/Next buttons disabled at bounds (adds `is-disabled` class)
- Page buttons show `is-active` class for current page
- Scrolls to job list when changing pages

### Global Functions

```javascript
// Manually refresh jobs from API
window.refreshJobBoard();
```

## Included tools

This template contains some preconfigured development tools:

- [Typescript](https://www.typescriptlang.org/): A superset of Javascript that adds an additional layer of Typings, bringing more security and efficiency to the written code.
- [Prettier](https://prettier.io/): Code formatting that assures consistency across all Finsweet's projects.
- [ESLint](https://eslint.org/): Code linting that enforces industries' best practices. It uses [our own custom configuration](https://github.com/finsweet/eslint-config) to maintain consistency across all Finsweet's projects.
- [Playwright](https://playwright.dev/): Fast and reliable end-to-end testing.
- [esbuild](https://esbuild.github.io/): Javascript bundler that compiles, bundles and minifies the original Typescript files.
- [Changesets](https://github.com/changesets/changesets): A way to manage your versioning and changelogs.
- [Finsweet's TypeScript Utils](https://github.com/finsweet/ts-utils): Some utilities to help you in your Webflow development.

## Requirements

This template requires the use of [pnpm](https://pnpm.js.org/en/). You can [install pnpm](https://pnpm.io/installation) with:

```bash
npm i -g pnpm
```

To enable automatic deployments to npm, please read the [Continuous Deployment](#continuous-deployment) section.

## Getting started

The quickest way to start developing a new project is by [creating a new repository from this template](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template).

Once the new repository has been created, update the `package.json` file with the correct information, specially the name of the package which has to be unique.

### Installing

After creating the new repository, open it in your terminal and install the packages by running:

```bash
pnpm install
```

If this is the first time using Playwright and you want to use it in this project, you'll also have to install the browsers by running:

```bash
pnpm playwright install
```

You can read more about the use of Playwright in the [Testing](#testing) section.

It is also recommended that you install the following extensions in your VSCode editor:

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

### Building

To build the files, you have two defined scripts:

- `pnpm dev`: Builds and creates a local server that serves all files (check [Serving files on development mode](#serving-files-on-development-mode) for more info).
- `pnpm build`: Builds to the production directory (`dist`).

### Serving files on development mode

When you run `pnpm dev`, two things happen:

- esbuild is set to `watch` mode. Every time that you save your files, the project will be rebuilt.
- A local server is created under `http://localhost:3000` that serves all your project files. You can import them in your Webflow projects like:

```html
<script defer src="http://localhost:3000/{FILE_PATH}.js"></script>
```

- Live Reloading is enabled by default, meaning that every time you save a change in your files, the website you're working on will reload automatically. You can disable it in `/bin/build.js`.

#### Live Reload & CDN/Production Builds

**Important:** Live reload only works when the page is served from `localhost`. The live-reload code checks `location.hostname` and only activates on `localhost` or `127.0.0.1`.

When serving files from a CDN or remote origin (e.g., `https://cdn.jsdelivr.net/...` or Webflow), live reload is automatically disabled to prevent CORS errors.

**For production/CDN deployments:**

- Always use `pnpm build` (sets `NODE_ENV=production`) which completely excludes live-reload from the bundle
- Dev builds (`pnpm dev`) include live-reload code but it's safely disabled on non-localhost origins

### Building multiple files

If you need to build multiple files into different outputs, you can do it by updating the build settings.

In `bin/build.js`, update the `ENTRY_POINTS` array with any files you'd like to build:

```javascript
const ENTRY_POINTS = [
  'src/home/index.ts',
  'src/contact/whatever.ts',
  'src/hooyah.ts',
  'src/home/other.ts',
];
```

This will tell `esbuild` to build all those files and output them in the `dist` folder for production and in `http://localhost:3000` for development.

### Building CSS files

CSS files are also supported by the bundler. When including a CSS file as an entry point, the compiler will generate a minified version in your output folder.

You can define a CSS entry point by either:

- Manually defining it in the `bin/build.js` config. [See previous section](#building-multiple-files) for reference.
- Or importing the file inside any of your JavaScript / TypeScript files:

```typescript
// src/index.ts
import './index.css';
```

CSS outputs are also available in `localhost` during [development mode](#serving-files-on-development-mode).

### Setting up a path alias

Path aliases are very helpful to avoid code like:

```typescript
import example from '../../../../utils/example';
```

Instead, we can create path aliases that map to a specific folder, so the code becomes cleaner like:

```typescript
import example from '$utils/example';
```

You can set up path aliases using the `paths` setting in `tsconfig.json`. This template has an already predefined path as an example:

```json
{
  "paths": {
    "$utils/*": ["src/utils/*"]
  }
}
```

To avoid any surprises, take some time to familiarize yourself with the [tsconfig](/tsconfig.json) enabled flags.

## Testing

As previously mentioned, this library has [Playwright](https://playwright.dev/) included as an automated testing tool.

All tests are located under the `/tests` folder. This template includes a test spec example that will help you catch up with Playwright.

After [installing the dependencies](#installing), you can try it out by running `pnpm test`.
Make sure you replace it with your own tests! Writing proper tests will help improve the maintainability and scalability of your project in the long term.

By default, Playwright will also run `pnpm dev` in the background while the tests are running, so [your files served](#serving-files-on-development-mode) under `localhost:3000` will run as usual.
You can disable this behavior in the `playwright.config.ts` file.

If you project doesn't require any testing, you should disable the Tests job in the [CI workflow](#continuous-integration) by commenting it out in the `.github/workflows/ci.yml` file.
This will prevent the tests from running when you open a Pull Request.

## Contributing guide

In general, your development workflow should look like this:

1. Create a new branch where to develop a new feature or bug fix.
2. Once you've finished the implementation, [create a Changeset](#continuous-deployment) (or multiple) explaining the changes that you've made in the codebase.
3. Open a Pull Request and wait until the [CI workflows](#continuous-integration) finish. If something fails, please try to fix it before merging the PR.
   If you don't want to wait for the CI workflows to run on GitHub to know if something fails, it will be always faster to run them in your machine before opening a PR.
4. Merge the Pull Request. The Changesets bot will automatically open a new PR with updates to the `CHANGELOG.md`, you should also merge that one. If you have [automatic npm deployments](#how-to-automatically-deploy-updates-to-npm) enabled, Changesets will also publish this new version on npm.

If you need to work on several features before publishing a new version on npm, it is a good practise to create a `development` branch where to merge all the PR's before pushing your code to master.

## Pre-defined scripts

This template contains a set of predefined scripts in the `package.json` file:

- `pnpm dev`: Builds and creates a local server that serves all files (check [Serving files on development mode](#serving-files-on-development-mode) for more info).
- `pnpm build`: Builds to the production directory (`dist`).
- `pnpm lint`: Scans the codebase with ESLint and Prettier to see if there are any errors.
- `pnpm lint:fix`: Fixes all auto-fixable issues in ESLint.
- `pnpm check`: Checks for TypeScript errors in the codebase.
- `pnpm format`: Formats all the files in the codebase using Prettier. You probably won't need this script if you have automatic [formatting on save](https://www.digitalocean.com/community/tutorials/code-formatting-with-prettier-in-visual-studio-code#automatically-format-on-save) active in your editor.
- `pnpm test`: Will run all the tests that are located in the `/tests` folder.
- `pnpm test:headed`: Will run all the tests that are located in the `/tests` folder visually in headed browsers.
- `pnpm release`: This command is defined for [Changesets](https://github.com/changesets/changesets). You don't have to interact with it.
- `pnpm run update`: Scans the dependencies of the project and provides an interactive UI to select the ones that you want to update.

## Release Process

To create and publish a new version:

1. **Create a changeset** - Document your changes

   ```bash
   pnpm changeset
   ```

   This opens an interactive prompt where you'll:
   - Select the version bump type (patch/minor/major)
   - Write a summary of your changes
   - A changeset file will be created in `.changeset/`

2. **Update version** - Apply the changeset to bump version numbers

   ```bash
   pnpm changeset version
   ```

   This will:
   - Update the version in `package.json`
   - Update the `CHANGELOG.md` file
   - Delete the changeset file

3. **Create and push a git tag** - Tag the release and push to remote

   ```bash
   git tag v0.0.1
   git push origin v0.0.1
   ```

   Replace `v0.0.1` with your new version number

4. **Update Webflow script tag** - Use the new version in your Webflow project
   ```html
   <script src="https://cdn.jsdelivr.net/gh/BX-Studio-Webflow/mega-menu-animation@v0.0.1/dist/index.js"></script>
   ```
   Update the version number in the `@v0.0.1` part of the URL to match your release
