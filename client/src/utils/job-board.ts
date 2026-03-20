/**
 * Job Board Controller
 * Handles fetching, filtering, and pagination of job listings
 */

// Types
interface Job {
  id: number;
  title: string;
  postedDate: string;
  location: {
    city: string;
    state: string;
    label: string;
    address: {
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      zipcode: string;
      country: string;
    };
  };
  department: string;
  status: {
    id: number;
    label: string;
  };
  hiringLead: {
    name: string;
    avatar: string;
  };
  applicants: {
    new: number;
    active: number;
    total: number;
  };
  postingUrl: string;
}

// Constants
const JOBS_PER_PAGE = 5;
const devMode = localStorage.getItem('devMode') === 'true';
const API_ENDPOINT = devMode
  ? 'http://localhost:8000/api/jobs'
  : 'https://larson-server.vercel.app/api/jobs';

// Constants
const FEATURED_JOBS_COUNT = 4;

// Dev-target selectors
const SELECTORS = {
  container: '[dev-role="job-container"]',
  filtersWrapper: '[dev-role="job-filters-wrapper"]',
  filterTag: '[dev-target="job-filter-tag"]',
  filterText: '[dev-target="job-filter-text"]',
  jobList: '[dev-target="job-list"]',
  jobCard: '[dev-target="one-job-card"]',
  jobTitle: '[dev-role="job-title"]',
  jobDesc: '[dev-role="job-desc"]',
  jobCategory: '[dev-target="job-category"]',
  jobCta: '[dev-target="job-cta"]',
  paginationWrapper: '[dev-role="job-pagination-wrapper"]',
  btnPrev: '[dev-target="btn-prev"]',
  btnNext: '[dev-target="btn-next"]',
  pageBtnTemplate: '[dev-target="page-btn-template"]',
  // Featured jobs selectors
  featuredJobList: '[dev-target="job-list-featured"]',
  featuredJobCard: '[dev-target="featured-job-card"]',
  featuredJobTitle: '[dev-target="featured-job-title"]',
  featuredJobDesc: '[dev-target="featured-job-desc"]',
  featuredJobCategory: '[dev-target="featured-job-category"]',
  featuredJobCta: '[dev-target="featured-job-cta"]',
} as const;

export class JobBoardController {
  private jobs: Job[] = [];
  private filteredJobs: Job[] = [];
  private currentPage = 1;
  private currentFilter: string | null = null;
  private departments: string[] = [];

  // DOM Elements
  private container: HTMLElement | null = null;
  private filtersWrapper: HTMLElement | null = null;
  private filterTemplate: HTMLElement | null = null;
  private jobList: HTMLElement | null = null;
  private jobCardTemplate: HTMLElement | null = null;
  private paginationWrapper: HTMLElement | null = null;
  private btnPrev: HTMLButtonElement | null = null;
  private btnNext: HTMLButtonElement | null = null;
  private pageBtnTemplate: HTMLButtonElement | null = null;
  private pageBtnWrapper: HTMLElement | null = null;

  // Featured jobs DOM elements (optional - may not exist on all pages)
  private featuredJobList: HTMLElement | null = null;
  private featuredJobCardTemplate: HTMLElement | null = null;

  /**
   * Initialize the job board
   */
  async init(): Promise<void> {
    if (!this.queryElements()) {
      return;
    }

    this.bindEvents();
    await this.loadJobs();
  }

  /**
   * Query and validate all required DOM elements
   */
  private queryElements(): boolean {
    this.container = document.querySelector(SELECTORS.container);
    if (!this.container) {
      console.error('[JobBoard] Missing required attribute: dev-role="job-container"');
      return false;
    }

    this.filtersWrapper = document.querySelector(SELECTORS.filtersWrapper);
    if (!this.filtersWrapper) {
      console.error('[JobBoard] Missing required attribute: dev-role="job-filters-wrapper"');
      return false;
    }

    this.filterTemplate = document.querySelector(SELECTORS.filterTag);
    if (!this.filterTemplate) {
      console.error('[JobBoard] Missing required attribute: dev-target="job-filter-tag"');
      return false;
    }

    this.jobList = document.querySelector(SELECTORS.jobList);
    if (!this.jobList) {
      console.error('[JobBoard] Missing required attribute: dev-target="job-list"');
      return false;
    }

    this.jobCardTemplate = document.querySelector(SELECTORS.jobCard);
    if (!this.jobCardTemplate) {
      console.error('[JobBoard] Missing required attribute: dev-target="one-job-card"');
      return false;
    }

    this.paginationWrapper = document.querySelector(SELECTORS.paginationWrapper);
    if (!this.paginationWrapper) {
      console.error('[JobBoard] Missing required attribute: dev-role="job-pagination-wrapper"');
      return false;
    }

    this.btnPrev = document.querySelector(SELECTORS.btnPrev);
    if (!this.btnPrev) {
      console.error('[JobBoard] Missing required attribute: dev-target="btn-prev"');
      return false;
    }

    this.btnNext = document.querySelector(SELECTORS.btnNext);
    if (!this.btnNext) {
      console.error('[JobBoard] Missing required attribute: dev-target="btn-next"');
      return false;
    }

    this.pageBtnTemplate = document.querySelector(SELECTORS.pageBtnTemplate);
    if (!this.pageBtnTemplate) {
      console.error('[JobBoard] Missing required attribute: dev-target="page-btn-template"');
      return false;
    }

    this.pageBtnWrapper = this.pageBtnTemplate.parentElement;
    if (!this.pageBtnWrapper) {
      console.error('[JobBoard] Page button template must have a parent wrapper');
      return false;
    }

    // Featured jobs elements (optional - won't fail if not present)
    this.featuredJobList = document.querySelector(SELECTORS.featuredJobList);
    this.featuredJobCardTemplate = document.querySelector(SELECTORS.featuredJobCard);

    if (this.featuredJobList && !this.featuredJobCardTemplate) {
      console.error('[JobBoard] Missing required attribute: dev-target="featured-job-card"');
    }

    return true;
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    this.btnPrev?.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    this.btnNext?.addEventListener('click', () => this.goToPage(this.currentPage + 1));
  }

  /**
   * Load jobs from API
   */
  private async loadJobs(): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.jobs = await response.json();
    } catch (error) {
      console.error('[JobBoard] Failed to fetch jobs:', error);
      return;
    }

    this.extractDepartments();
    this.renderFeaturedJobs();
    this.renderFilters();
    this.applyFilter(null); // Show all jobs initially
  }

  /**
   * Render featured jobs (4 most recent by postedDate)
   */
  private renderFeaturedJobs(): void {
    if (!this.featuredJobList || !this.featuredJobCardTemplate) return;

    // Clear existing featured jobs
    this.featuredJobList.innerHTML = '';

    // Sort jobs by postedDate (most recent first) and take top 4
    const featuredJobs = [...this.jobs]
      .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
      .slice(0, FEATURED_JOBS_COUNT);

    // Render each featured job
    featuredJobs.forEach((job) => {
      const card = this.featuredJobCardTemplate!.cloneNode(true) as HTMLElement;

      // Job title
      const titleEl = card.querySelector(SELECTORS.featuredJobTitle);
      if (titleEl) {
        titleEl.textContent = job.title;
      }

      // Job description (location.label)
      const descEl = card.querySelector(SELECTORS.featuredJobDesc);
      if (descEl) {
        descEl.textContent = job.location.label;
      }

      // Job category (department)
      const categoryEl = card.querySelector(SELECTORS.featuredJobCategory);
      if (categoryEl) {
        categoryEl.textContent = job.department;
      }

      // Job CTA
      const ctaEl = card.querySelector(SELECTORS.featuredJobCta) as HTMLAnchorElement | null;
      if (ctaEl) {
        ctaEl.href = job.postingUrl;
        ctaEl.target = '_blank';
        ctaEl.rel = 'noopener noreferrer';
      }

      this.featuredJobList!.appendChild(card);
    });
  }

  /**
   * Extract unique departments that have at least one job
   */
  private extractDepartments(): void {
    const deptSet = new Set<string>();
    this.jobs.forEach((job) => {
      if (job.department) {
        deptSet.add(job.department);
      }
    });
    this.departments = Array.from(deptSet).sort();
  }

  /**
   * Render filter buttons
   */
  private renderFilters(): void {
    if (!this.filtersWrapper || !this.filterTemplate) return;

    // Clear existing filters
    this.filtersWrapper.innerHTML = '';

    // Create "View all" filter
    const viewAllBtn = this.filterTemplate.cloneNode(true) as HTMLElement;
    const viewAllText = viewAllBtn.querySelector(SELECTORS.filterText);
    if (viewAllText) {
      viewAllText.textContent = 'View all';
    }
    viewAllBtn.classList.add('is-active');
    viewAllBtn.addEventListener('click', () => this.handleFilterClick(null, viewAllBtn));
    this.filtersWrapper.appendChild(viewAllBtn);

    // Create department filters
    this.departments.forEach((dept) => {
      const filterBtn = this.filterTemplate!.cloneNode(true) as HTMLElement;
      const filterText = filterBtn.querySelector(SELECTORS.filterText);
      if (filterText) {
        filterText.textContent = dept;
      }
      filterBtn.classList.remove('is-active');
      filterBtn.addEventListener('click', () => this.handleFilterClick(dept, filterBtn));
      this.filtersWrapper!.appendChild(filterBtn);
    });
  }

  /**
   * Handle filter button click
   */
  private handleFilterClick(department: string | null, button: HTMLElement): void {
    // Update active state
    const allFilters = this.filtersWrapper?.querySelectorAll(SELECTORS.filterTag);
    allFilters?.forEach((filter) => filter.classList.remove('is-active'));
    button.classList.add('is-active');

    this.applyFilter(department);
  }

  /**
   * Apply filter and reset to page 1
   */
  private applyFilter(department: string | null): void {
    this.currentFilter = department;
    this.currentPage = 1;

    if (department === null) {
      this.filteredJobs = [...this.jobs];
    } else {
      this.filteredJobs = this.jobs.filter((job) => job.department === department);
    }

    this.renderJobs();
    this.renderPagination();
  }

  /**
   * Render job cards for current page
   */
  private renderJobs(): void {
    if (!this.jobList || !this.jobCardTemplate) return;

    // Clear existing jobs
    this.jobList.innerHTML = '';

    // Calculate pagination slice
    const startIndex = (this.currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const pageJobs = this.filteredJobs.slice(startIndex, endIndex);

    // Render each job
    pageJobs.forEach((job) => {
      const card = this.jobCardTemplate!.cloneNode(true) as HTMLElement;

      // Job title
      const titleEl = card.querySelector(SELECTORS.jobTitle);
      if (titleEl) {
        titleEl.textContent = job.title;
      }

      // Job description (location.label)
      const descEl = card.querySelector(SELECTORS.jobDesc);
      if (descEl) {
        descEl.textContent = job.location.label;
      }

      // Job category (department)
      const categoryEl = card.querySelector(SELECTORS.jobCategory);
      if (categoryEl) {
        categoryEl.textContent = job.department;
      }

      // Job CTA
      const ctaEl = card.querySelector(SELECTORS.jobCta) as HTMLAnchorElement | null;
      if (ctaEl) {
        ctaEl.href = job.postingUrl;
        ctaEl.target = '_blank';
        ctaEl.rel = 'noopener noreferrer';
      }

      this.jobList!.appendChild(card);
    });
  }

  /**
   * Render pagination controls
   */
  private renderPagination(): void {
    if (!this.paginationWrapper || !this.pageBtnTemplate || !this.pageBtnWrapper) return;

    const totalPages = Math.ceil(this.filteredJobs.length / JOBS_PER_PAGE);

    // Show/hide pagination wrapper
    if (this.filteredJobs.length <= JOBS_PER_PAGE) {
      this.paginationWrapper.classList.add('hide');
    } else {
      this.paginationWrapper.classList.remove('hide');
    }

    // Update prev/next button states
    if (this.btnPrev) {
      this.btnPrev.disabled = this.currentPage <= 1;
      this.btnPrev.classList.toggle('is-disabled', this.currentPage <= 1);
    }

    if (this.btnNext) {
      this.btnNext.disabled = this.currentPage >= totalPages;
      this.btnNext.classList.toggle('is-disabled', this.currentPage >= totalPages);
    }

    // Clear existing page buttons
    this.pageBtnWrapper.innerHTML = '';

    // Create page buttons
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = this.pageBtnTemplate.cloneNode(true) as HTMLButtonElement;
      pageBtn.textContent = String(i);
      pageBtn.classList.toggle('is-active', i === this.currentPage);
      pageBtn.addEventListener('click', () => this.goToPage(i));
      this.pageBtnWrapper.appendChild(pageBtn);
    }
  }

  /**
   * Navigate to a specific page
   */
  private goToPage(page: number): void {
    const totalPages = Math.ceil(this.filteredJobs.length / JOBS_PER_PAGE);

    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    this.renderJobs();
    this.renderPagination();

    // Scroll to top of job list
    this.jobList?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Refresh jobs from API
   */
  async refresh(): Promise<void> {
    await this.loadJobs();
  }
}

// Expose refresh function globally
declare global {
  interface Window {
    refreshJobBoard: (() => Promise<void>) | null;
  }
}

window.refreshJobBoard = null;
