"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/utils/job-board.ts
  var JOBS_PER_PAGE = 5;
  var devMode = localStorage.getItem("devMode") === "true";
  var API_ENDPOINT = devMode ? "http://localhost:8000/api/jobs" : "https://larson-server.vercel.app/api/jobs";
  var FEATURED_JOBS_COUNT = 4;
  var SELECTORS = {
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
    featuredJobCta: '[dev-target="featured-job-cta"]'
  };
  var JobBoardController = class {
    jobs = [];
    filteredJobs = [];
    currentPage = 1;
    currentFilter = null;
    departments = [];
    // DOM Elements
    container = null;
    filtersWrapper = null;
    filterTemplate = null;
    jobList = null;
    jobCardTemplate = null;
    paginationWrapper = null;
    btnPrev = null;
    btnNext = null;
    pageBtnTemplate = null;
    pageBtnWrapper = null;
    // Featured jobs DOM elements (optional - may not exist on all pages)
    featuredJobList = null;
    featuredJobCardTemplate = null;
    /**
     * Initialize the job board
     */
    async init() {
      if (!this.queryElements()) {
        return;
      }
      this.bindEvents();
      await this.loadJobs();
    }
    /**
     * Query and validate all required DOM elements
     */
    queryElements() {
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
        console.error("[JobBoard] Page button template must have a parent wrapper");
        return false;
      }
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
    bindEvents() {
      this.btnPrev?.addEventListener("click", () => this.goToPage(this.currentPage - 1));
      this.btnNext?.addEventListener("click", () => this.goToPage(this.currentPage + 1));
    }
    /**
     * Load jobs from API
     */
    async loadJobs() {
      try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.jobs = await response.json();
      } catch (error) {
        console.error("[JobBoard] Failed to fetch jobs:", error);
        return;
      }
      this.extractDepartments();
      this.renderFeaturedJobs();
      this.renderFilters();
      this.applyFilter(null);
    }
    /**
     * Render featured jobs (4 most recent by postedDate)
     */
    renderFeaturedJobs() {
      if (!this.featuredJobList || !this.featuredJobCardTemplate) return;
      this.featuredJobList.innerHTML = "";
      const featuredJobs = [...this.jobs].sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()).slice(0, FEATURED_JOBS_COUNT);
      featuredJobs.forEach((job) => {
        const card = this.featuredJobCardTemplate.cloneNode(true);
        const titleEl = card.querySelector(SELECTORS.featuredJobTitle);
        if (titleEl) {
          titleEl.textContent = job.title;
        }
        const descEl = card.querySelector(SELECTORS.featuredJobDesc);
        if (descEl) {
          descEl.textContent = job.location.label;
        }
        const categoryEl = card.querySelector(SELECTORS.featuredJobCategory);
        if (categoryEl) {
          categoryEl.textContent = job.department;
        }
        const ctaEl = card.querySelector(SELECTORS.featuredJobCta);
        if (ctaEl) {
          ctaEl.href = job.postingUrl;
          ctaEl.target = "_blank";
          ctaEl.rel = "noopener noreferrer";
        }
        this.featuredJobList.appendChild(card);
      });
    }
    /**
     * Extract unique departments that have at least one job
     */
    extractDepartments() {
      const deptSet = /* @__PURE__ */ new Set();
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
    renderFilters() {
      if (!this.filtersWrapper || !this.filterTemplate) return;
      this.filtersWrapper.innerHTML = "";
      const viewAllBtn = this.filterTemplate.cloneNode(true);
      const viewAllText = viewAllBtn.querySelector(SELECTORS.filterText);
      if (viewAllText) {
        viewAllText.textContent = "View all";
      }
      viewAllBtn.classList.add("is-active");
      viewAllBtn.addEventListener("click", () => this.handleFilterClick(null, viewAllBtn));
      this.filtersWrapper.appendChild(viewAllBtn);
      this.departments.forEach((dept) => {
        const filterBtn = this.filterTemplate.cloneNode(true);
        const filterText = filterBtn.querySelector(SELECTORS.filterText);
        if (filterText) {
          filterText.textContent = dept;
        }
        filterBtn.classList.remove("is-active");
        filterBtn.addEventListener("click", () => this.handleFilterClick(dept, filterBtn));
        this.filtersWrapper.appendChild(filterBtn);
      });
    }
    /**
     * Handle filter button click
     */
    handleFilterClick(department, button) {
      const allFilters = this.filtersWrapper?.querySelectorAll(SELECTORS.filterTag);
      allFilters?.forEach((filter) => filter.classList.remove("is-active"));
      button.classList.add("is-active");
      this.applyFilter(department);
    }
    /**
     * Apply filter and reset to page 1
     */
    applyFilter(department) {
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
    renderJobs() {
      if (!this.jobList || !this.jobCardTemplate) return;
      this.jobList.innerHTML = "";
      const startIndex = (this.currentPage - 1) * JOBS_PER_PAGE;
      const endIndex = startIndex + JOBS_PER_PAGE;
      const pageJobs = this.filteredJobs.slice(startIndex, endIndex);
      pageJobs.forEach((job) => {
        const card = this.jobCardTemplate.cloneNode(true);
        const titleEl = card.querySelector(SELECTORS.jobTitle);
        if (titleEl) {
          titleEl.textContent = job.title;
        }
        const descEl = card.querySelector(SELECTORS.jobDesc);
        if (descEl) {
          descEl.textContent = job.location.label;
        }
        const categoryEl = card.querySelector(SELECTORS.jobCategory);
        if (categoryEl) {
          categoryEl.textContent = job.department;
        }
        const ctaEl = card.querySelector(SELECTORS.jobCta);
        if (ctaEl) {
          ctaEl.href = job.postingUrl;
          ctaEl.target = "_blank";
          ctaEl.rel = "noopener noreferrer";
        }
        this.jobList.appendChild(card);
      });
    }
    /**
     * Render pagination controls
     */
    renderPagination() {
      if (!this.paginationWrapper || !this.pageBtnTemplate || !this.pageBtnWrapper) return;
      const totalPages = Math.ceil(this.filteredJobs.length / JOBS_PER_PAGE);
      if (this.filteredJobs.length <= JOBS_PER_PAGE) {
        this.paginationWrapper.classList.add("hide");
      } else {
        this.paginationWrapper.classList.remove("hide");
      }
      if (this.btnPrev) {
        this.btnPrev.disabled = this.currentPage <= 1;
        this.btnPrev.classList.toggle("is-disabled", this.currentPage <= 1);
      }
      if (this.btnNext) {
        this.btnNext.disabled = this.currentPage >= totalPages;
        this.btnNext.classList.toggle("is-disabled", this.currentPage >= totalPages);
      }
      this.pageBtnWrapper.innerHTML = "";
      for (let i = 1; i <= totalPages; i++) {
        const pageBtn = this.pageBtnTemplate.cloneNode(true);
        pageBtn.textContent = String(i);
        pageBtn.classList.toggle("is-active", i === this.currentPage);
        pageBtn.addEventListener("click", () => this.goToPage(i));
        this.pageBtnWrapper.appendChild(pageBtn);
      }
    }
    /**
     * Navigate to a specific page
     */
    goToPage(page) {
      const totalPages = Math.ceil(this.filteredJobs.length / JOBS_PER_PAGE);
      if (page < 1 || page > totalPages) return;
      this.currentPage = page;
      this.renderJobs();
      this.renderPagination();
      this.jobList?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    /**
     * Refresh jobs from API
     */
    async refresh() {
      await this.loadJobs();
    }
  };
  window.refreshJobBoard = null;

  // src/index.ts
  window.Webflow ||= [];
  window.Webflow.push(async () => {
    const jobBoardContainer = document.querySelector('[dev-role="job-container"]');
    if (jobBoardContainer) {
      const jobBoard = new JobBoardController();
      await jobBoard.init();
      window.refreshJobBoard = () => jobBoard.refresh();
    }
  });
})();
//# sourceMappingURL=index.js.map
