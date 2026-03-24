/**
 * Careers job board: fetch once, filter in memory, re-render list from a template.
 * Wires to the existing filter UI (native select + search input inside the form).
 */

interface WorkdayJob {
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

type Job = WorkdayJob & Record<string, unknown>;

function getTitle(job: Job): string {
  const v = job.title ?? (job as Record<string, unknown>).jobPostingTitle ?? job.descriptor;
  return String(v ?? '');
}

function getLocationLabel(job: Job): string {
  const primary = job.primaryLocation;
  const loc = job as Record<string, unknown>;
  const v =
    primary?.descriptor ??
    loc.locationsText ??
    loc.locations_text ??
    (loc.location as { label?: string } | undefined)?.label;
  return String(v ?? '');
}

function getCategory(job: Job): string {
  const cats = job.categories;
  const loc = job as Record<string, unknown>;
  const v =
    (Array.isArray(cats) && cats[0]?.descriptor) ??
    loc.department ??
    (loc.jobFamilyReference as { descriptor?: string })?.descriptor ??
    (loc.supervisoryOrganizationReference as { descriptor?: string })?.descriptor;
  return String(v ?? 'General');
}

function getPostingUrl(job: Job): string {
  const loc = job as Record<string, unknown>;
  const v =
    job.url ?? loc.externalApplyUrl ?? loc.externalApplyURL ?? loc.postingUrl ?? loc.applyUrl;
  if (typeof v === 'string' && v.startsWith('http')) return v;
  const path = loc.externalPath ?? loc.externalJobPath;
  if (typeof path === 'string' && path) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  return '#';
}

function getTimeType(job: Job): string {
  return job.timeType?.descriptor ?? '';
}

function getSecondaryLine(job: Job): string {
  const company = job.company?.descriptor?.trim();
  if (company) return company;
  return job.jobType?.descriptor ?? '';
}

function matchesLocation(job: Job, filter: string): boolean {
  const f = filter.trim().toLowerCase();
  if (!f) return true;
  const loc = getLocationLabel(job).toLowerCase();
  if (loc === f) return true;
  if (loc.startsWith(f + ',')) return true;
  if (f.includes(',') && loc === f) return true;
  return loc.includes(f);
}

function matchesCategory(job: Job, filter: string): boolean {
  const f = filter.trim().toLowerCase();
  if (!f) return true;
  return getCategory(job).toLowerCase() === f;
}

function matchesTitleSearch(job: Job, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return getTitle(job).toLowerCase().includes(q);
}

function filterJobs(jobs: Job[], location: string, category: string, title: string): Job[] {
  return jobs.filter(
    (job) =>
      matchesLocation(job, location) &&
      matchesCategory(job, category) &&
      matchesTitleSearch(job, title)
  );
}

export type CareersListMode = 'all' | 'cities' | 'interns';

/** `city="alexandria-in"` → slug `alexandria`, state `IN` */
export function parseCityAttribute(value: string): { citySlug: string; stateCode: string } | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  const last = v.lastIndexOf('-');
  if (last <= 0) return null;
  const maybeState = v.slice(last + 1);
  if (maybeState.length !== 2 || !/^[a-z]{2}$/.test(maybeState)) return null;
  return { citySlug: v.slice(0, last), stateCode: maybeState.toUpperCase() };
}

function normalizeLocationCitySlug(descriptor: string): string {
  const beforeComma = descriptor.split(',')[0]?.trim() ?? '';
  return beforeComma
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function matchesCityPage(job: Job, parsed: { citySlug: string; stateCode: string }): boolean {
  const code = job.primaryLocation?.region?.code?.toUpperCase();
  if (code !== parsed.stateCode) return false;
  const slug = normalizeLocationCitySlug(getLocationLabel(job));
  return slug === parsed.citySlug;
}

function isInternJob(job: Job): boolean {
  const title = getTitle(job).toLowerCase();
  const jt = job.jobType?.descriptor?.toLowerCase() ?? '';
  return title.includes('intern') || jt.includes('intern');
}

function normalizeListMode(raw: string | null): CareersListMode {
  const m = (raw ?? 'all').trim().toLowerCase();
  if (m === 'cities' || m === 'interns') return m;
  return 'all';
}

const devMode = localStorage.getItem('api-mode') === 'local';
const API_ENDPOINT = devMode
  ? 'http://localhost:8000/api/jobs'
  : 'https://poet-server.vercel.app/api/jobs';

const SELECTORS = {
  root: '.careers-list_list_wrap',
  filtersForm: 'form.careers-list_filters_form',
  filterLocation: 'select[fs-list-field="location"]',
  filterCategory: 'select[fs-list-field="category"]',
  filterTitle: 'input[fs-list-field="title"]',
  list: '.careers-list_list',
  item: '.careers-list_item',
  cardTitle: '[fs-list-field="title"], .career-card_heading_text',
  location: '[fs-list-field="location"]',
  category: '[fs-list-field="category"], [fs-list-field="job-category"]',
  secondaryText: '.career-card_text',
  detailLabels: '.career-card_detail_wrap .career-card_detail_label',
  applyAnchor: '.career-card_details_button a',
  clickableBtn: '.clickable_btn',
  clickableSrText: '.clickable_text',
} as const;

function populateCareerItem(item: HTMLElement, job: Job): void {
  const title = getTitle(job);
  const location = getLocationLabel(job);
  const category = getCategory(job);
  const url = getPostingUrl(job);
  const timeType = getTimeType(job);
  const secondary = getSecondaryLine(job);

  const titleEl = item.querySelector(SELECTORS.cardTitle);
  if (titleEl) titleEl.textContent = title;

  const sub = item.querySelector(SELECTORS.secondaryText);
  if (sub) sub.textContent = secondary;

  const locEl = item.querySelector(SELECTORS.location);
  if (locEl) locEl.textContent = location;

  const labels = item.querySelectorAll(SELECTORS.detailLabels);
  if (labels.length >= 2) {
    (labels[1] as HTMLElement).textContent = timeType || '—';
  }

  item.querySelectorAll(SELECTORS.category).forEach((el) => {
    el.textContent = category;
  });

  const applyLink = item.querySelector(SELECTORS.applyAnchor) as HTMLAnchorElement | null;
  if (applyLink) {
    applyLink.href = url;
    applyLink.target = '_blank';
    applyLink.rel = 'noopener noreferrer';
  }

  const sr = item.querySelector(SELECTORS.clickableSrText);
  if (sr) sr.textContent = title;

  const btn = item.querySelector(SELECTORS.clickableBtn);
  if (btn && url.startsWith('http')) {
    const open = (e: Event) => {
      e.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    };
    btn.addEventListener('click', open);
  }
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout> | undefined;
  return ((...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  }) as T;
}

export class JobBoardController {
  private jobs: Job[] = [];
  private itemTemplate: HTMLElement | null = null;
  private root: HTMLElement | null = null;
  private jobList: HTMLElement | null = null;
  private filterForm: HTMLFormElement | null = null;
  private listMode: CareersListMode = 'all';
  private cityParsed: { citySlug: string; stateCode: string } | null = null;

  async init(): Promise<void> {
    this.root = document.querySelector(SELECTORS.root);
    if (!this.root) {
      console.error('[JobBoard] Missing .careers-list_list_wrap');
      return;
    }

    this.jobList = this.root.querySelector(SELECTORS.list);
    if (!this.jobList) {
      console.error('[JobBoard] Missing .careers-list_list');
      return;
    }

    const templateItem = this.jobList.querySelector(SELECTORS.item);
    if (!templateItem || !(templateItem instanceof HTMLElement)) {
      console.error('[JobBoard] Missing template .careers-list_item');
      return;
    }

    this.itemTemplate = templateItem.cloneNode(true) as HTMLElement;
    this.filterForm = this.root.querySelector(SELECTORS.filtersForm);

    this.listMode = normalizeListMode(this.jobList.getAttribute('mode'));
    const cityAttr = this.jobList.getAttribute('city') ?? '';
    this.cityParsed = this.listMode === 'cities' ? parseCityAttribute(cityAttr) : null;
    if (this.listMode === 'cities' && !this.cityParsed) {
      console.error(
        '[JobBoard] mode="cities" requires city="{city-slug}-{st}" (e.g. alexandria-in); got:',
        cityAttr || '(empty)'
      );
    }

    await this.loadJobs();

    this.bindFilters();
    this.renderFiltered();

    window.dispatchEvent(
      new CustomEvent('jobboard:rendered', {
        detail: {
          count: this.jobs.length,
          mode: this.listMode,
          city: this.cityParsed,
        },
      })
    );
  }

  private readFilterInputs(): { location: string; category: string; title: string } {
    const loc =
      this.filterForm?.querySelector<HTMLSelectElement>(SELECTORS.filterLocation)?.value ?? '';
    const cat =
      this.filterForm?.querySelector<HTMLSelectElement>(SELECTORS.filterCategory)?.value ?? '';
    const title =
      this.filterForm?.querySelector<HTMLInputElement>(SELECTORS.filterTitle)?.value ?? '';
    return { location: loc, category: cat, title };
  }

  private bindFilters(): void {
    if (!this.filterForm) return;

    this.filterForm.addEventListener('submit', (e) => e.preventDefault());
    this.filterForm.addEventListener('change', () => this.renderFiltered());

    const titleInput = this.filterForm.querySelector<HTMLInputElement>(SELECTORS.filterTitle);
    if (titleInput) {
      titleInput.addEventListener(
        'input',
        debounce(() => this.renderFiltered(), 200)
      );
    }
  }

  private jobsAfterMode(): Job[] {
    if (this.listMode === 'cities') {
      if (!this.cityParsed) return [];
      return this.jobs.filter((j) => matchesCityPage(j, this.cityParsed!));
    }
    if (this.listMode === 'interns') {
      return this.jobs.filter(isInternJob);
    }
    return this.jobs;
  }

  private renderFiltered(): void {
    if (!this.jobList || !this.itemTemplate) return;

    const { location, category, title } = this.readFilterInputs();
    const pool = this.jobsAfterMode();
    const visible = filterJobs(pool, location, category, title);

    this.jobList.innerHTML = '';

    for (const job of visible) {
      const item = this.itemTemplate.cloneNode(true) as HTMLElement;
      populateCareerItem(item, job);
      this.jobList.appendChild(item);
    }

    window.dispatchEvent(
      new CustomEvent('jobboard:filtered', {
        detail: {
          total: this.jobs.length,
          pool: pool.length,
          visible: visible.length,
          location,
          category,
          title,
          mode: this.listMode,
          city: this.cityParsed,
        },
      })
    );
  }

  private async loadJobs(): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const raw = await response.json();
      const arr = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.jobPostings)
            ? raw.jobPostings
            : [];
      this.jobs = arr as Job[];
    } catch (error) {
      console.error('[JobBoard] Failed to fetch jobs:', error);
      this.jobs = [];
    }
  }

  async refresh(): Promise<void> {
    if (!this.jobList || !this.itemTemplate) return;

    await this.loadJobs();
    this.renderFiltered();

    window.dispatchEvent(
      new CustomEvent('jobboard:rendered', {
        detail: {
          count: this.jobs.length,
          mode: this.listMode,
          city: this.cityParsed,
        },
      })
    );
  }
}

declare global {
  interface Window {
    refreshJobBoard: (() => Promise<void>) | null;
  }
}

window.refreshJobBoard = null;
