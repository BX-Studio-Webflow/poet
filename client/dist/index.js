"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/utils/job-board.ts
  function getTitle(job) {
    const v = job.title ?? job.jobPostingTitle ?? job.descriptor;
    return String(v ?? "");
  }
  function getLocationLabel(job) {
    const primary = job.primaryLocation;
    const loc = job;
    const v = primary?.descriptor ?? loc.locationsText ?? loc.locations_text ?? loc.location?.label;
    return String(v ?? "");
  }
  function getCategory(job) {
    const cats = job.categories;
    const loc = job;
    const v = (Array.isArray(cats) && cats[0]?.descriptor) ?? loc.department ?? loc.jobFamilyReference?.descriptor ?? loc.supervisoryOrganizationReference?.descriptor;
    return String(v ?? "General");
  }
  function getPostingUrl(job) {
    const loc = job;
    const v = job.url ?? loc.externalApplyUrl ?? loc.externalApplyURL ?? loc.postingUrl ?? loc.applyUrl;
    if (typeof v === "string" && v.startsWith("http")) return v;
    const path = loc.externalPath ?? loc.externalJobPath;
    if (typeof path === "string" && path) {
      return path.startsWith("/") ? path : `/${path}`;
    }
    return "#";
  }
  function getTimeType(job) {
    return job.timeType?.descriptor ?? "";
  }
  function getSecondaryLine(job) {
    const company = job.company?.descriptor?.trim();
    if (company) return company;
    return job.jobType?.descriptor ?? "";
  }
  function matchesLocation(job, filter) {
    const f = filter.trim().toLowerCase();
    if (!f) return true;
    const loc = getLocationLabel(job).toLowerCase();
    if (loc === f) return true;
    if (loc.startsWith(f + ",")) return true;
    if (f.includes(",") && loc === f) return true;
    return loc.includes(f);
  }
  function matchesCategory(job, filter) {
    const f = filter.trim().toLowerCase();
    if (!f) return true;
    return getCategory(job).toLowerCase() === f;
  }
  function matchesTitleSearch(job, query) {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return getTitle(job).toLowerCase().includes(q);
  }
  function filterJobs(jobs, location2, category, title) {
    return jobs.filter(
      (job) => matchesLocation(job, location2) && matchesCategory(job, category) && matchesTitleSearch(job, title)
    );
  }
  function parseCityAttribute(value) {
    const v = value.trim().toLowerCase();
    if (!v) return null;
    const last = v.lastIndexOf("-");
    if (last <= 0) return null;
    const maybeState = v.slice(last + 1);
    if (maybeState.length !== 2 || !/^[a-z]{2}$/.test(maybeState)) return null;
    return { citySlug: v.slice(0, last), stateCode: maybeState };
  }
  function normalizeListMode(raw) {
    const m = (raw ?? "all").trim().toLowerCase();
    if (m === "cities" || m === "interns") return m;
    return "all";
  }
  var devMode = localStorage.getItem("api-mode") === "local";
  var API_ENDPOINT = devMode ? "http://localhost:8000/api/jobs" : "https://poet-server.vercel.app/api/jobs";
  var SELECTORS = {
    root: ".careers-list_list_wrap",
    filtersForm: "form.careers-list_filters_form",
    filterLocation: 'select[fs-list-field="location"]',
    filterCategory: 'select[fs-list-field="category"]',
    filterTitle: 'input[fs-list-field="title"]',
    list: ".careers-list_list",
    item: ".careers-list_item",
    cardTitle: '[fs-list-field="title"], .career-card_heading_text',
    location: '[fs-list-field="location"]',
    category: '[fs-list-field="category"], [fs-list-field="job-category"]',
    secondaryText: ".career-card_text",
    detailLabels: ".career-card_detail_wrap .career-card_detail_label",
    applyAnchor: ".career-card_details_button a",
    clickableBtn: ".clickable_btn",
    clickableSrText: ".clickable_text",
    paginationWrap: ".pagination_wrap",
    empty: '[data-careers-el="empty"]'
  };
  function populateCareerItem(item, job) {
    const title = getTitle(job);
    const location2 = getLocationLabel(job);
    const category = getCategory(job);
    const url = getPostingUrl(job);
    const timeType = getTimeType(job);
    const secondary = getSecondaryLine(job);
    const titleEl = item.querySelector(SELECTORS.cardTitle);
    if (titleEl) titleEl.textContent = title;
    const sub = item.querySelector(SELECTORS.secondaryText);
    if (sub) sub.textContent = secondary;
    const locEl = item.querySelector(SELECTORS.location);
    if (locEl) locEl.textContent = location2;
    const labels = item.querySelectorAll(SELECTORS.detailLabels);
    if (labels.length >= 2) {
      labels[1].textContent = timeType || "\u2014";
    }
    item.querySelectorAll(SELECTORS.category).forEach((el) => {
      el.textContent = category;
    });
    const applyLink = item.querySelector(SELECTORS.applyAnchor);
    if (applyLink) {
      applyLink.href = url;
      applyLink.target = "_blank";
      applyLink.rel = "noopener noreferrer";
    }
    const sr = item.querySelector(SELECTORS.clickableSrText);
    if (sr) sr.textContent = title;
    const btn = item.querySelector(SELECTORS.clickableBtn);
    if (btn && url.startsWith("http")) {
      const open = (e) => {
        e.preventDefault();
        window.open(url, "_blank", "noopener,noreferrer");
      };
      btn.addEventListener("click", open);
    }
  }
  function debounce(fn, ms) {
    let t;
    return (...args) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }
  var JobBoardController = class {
    jobs = [];
    itemTemplate = null;
    root = null;
    jobList = null;
    filterForm = null;
    listMode = "all";
    cityParsed = null;
    currentPage = 1;
    itemsPerPage = 10;
    async init() {
      this.root = document.querySelector(SELECTORS.root);
      if (!this.root) {
        console.error("[JobBoard] Missing .careers-list_list_wrap");
        return;
      }
      this.jobList = this.root.querySelector(SELECTORS.list);
      if (!this.jobList) {
        console.error("[JobBoard] Missing .careers-list_list");
        return;
      }
      const templateItem = this.jobList.querySelector(SELECTORS.item);
      if (!templateItem || !(templateItem instanceof HTMLElement)) {
        console.error("[JobBoard] Missing template .careers-list_item");
        return;
      }
      this.itemTemplate = templateItem.cloneNode(true);
      this.filterForm = this.root.querySelector(SELECTORS.filtersForm);
      this.listMode = normalizeListMode(this.jobList.getAttribute("mode"));
      const cityAttr = this.jobList.getAttribute("city") ?? "";
      this.cityParsed = this.listMode === "cities" ? parseCityAttribute(cityAttr) : null;
      if (this.listMode === "cities" && !this.cityParsed) {
        console.error(
          '[JobBoard] mode="cities" requires city="{city-slug}-{st}" (e.g. alexandria-in); got:',
          cityAttr || "(empty)"
        );
      }
      await this.loadJobs();
      if (window.location.pathname === "/about/locations") {
        this.updateLocationCategories();
      }
      this.bindFilters();
      this.applyUrlFilterValues();
      this.bindPagination();
      this.bindReset();
      this.renderFiltered();
      window.dispatchEvent(
        new CustomEvent("jobboard:rendered", {
          detail: {
            count: this.jobs.length,
            mode: this.listMode,
            city: this.cityParsed
          }
        })
      );
    }
    readFilterInputs() {
      const loc = this.filterForm?.querySelector(SELECTORS.filterLocation)?.value ?? "";
      const cat = this.filterForm?.querySelector(SELECTORS.filterCategory)?.value ?? "";
      const title = this.filterForm?.querySelector(SELECTORS.filterTitle)?.value ?? "";
      return { location: loc, category: cat, title };
    }
    applyUrlFilterValues() {
      if (!this.filterForm) return;
      const params = new URLSearchParams(window.location.search);
      const locationValue = params.get("careers_location_equal") ?? params.get("careers_location") ?? params.get("location");
      const categoryValue = params.get("careers_category_equal") ?? params.get("careers_category") ?? params.get("category");
      const titleValue = params.get("careers_title_contains") ?? params.get("careers_title") ?? params.get("title");
      const setSelectValue = (field, value) => {
        if (!value) return;
        const select = this.filterForm?.querySelector(SELECTORS[field]);
        if (!select) return;
        const candidate = Array.from(select.options).find(
          (opt) => opt.value === value || opt.textContent?.trim() === value
        );
        if (candidate) {
          select.value = candidate.value;
        } else {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
          select.value = value;
        }
        select.dispatchEvent(new Event("change", { bubbles: true }));
      };
      if (locationValue) setSelectValue("filterLocation", locationValue);
      if (categoryValue) setSelectValue("filterCategory", categoryValue);
      if (titleValue) {
        const titleInput = this.filterForm.querySelector(SELECTORS.filterTitle);
        if (titleInput) titleInput.value = titleValue;
      }
      if (locationValue || categoryValue || titleValue) {
        this.currentPage = 1;
      }
    }
    bindFilters() {
      if (!this.filterForm) return;
      this.filterForm.addEventListener("submit", (e) => e.preventDefault());
      this.filterForm.addEventListener("change", () => {
        this.currentPage = 1;
        this.renderFiltered();
      });
      const titleInput = this.filterForm.querySelector(SELECTORS.filterTitle);
      if (titleInput) {
        titleInput.addEventListener(
          "input",
          debounce(() => {
            this.currentPage = 1;
            this.renderFiltered();
          }, 200)
        );
      }
    }
    bindPagination() {
      const paginationWrap = this.root?.querySelector(SELECTORS.paginationWrap);
      if (!paginationWrap) return;
      paginationWrap.addEventListener("click", (e) => {
        e.preventDefault();
        const target = e.target;
        const link = target.closest("a");
        if (!link) return;
        const linkWrap = link.closest(".pagination_link_wrap");
        if (linkWrap) {
          const isPrev = linkWrap === paginationWrap.firstElementChild;
          if (isPrev) {
            this.currentPage = Math.max(1, this.currentPage - 1);
          } else {
            const { location: location2, category, title } = this.readFilterInputs();
            const pool = this.jobsAfterMode();
            const allVisible = filterJobs(pool, location2, category, title);
            const totalPages = Math.ceil(allVisible.length / this.itemsPerPage);
            this.currentPage = Math.min(totalPages, this.currentPage + 1);
          }
          this.renderFiltered();
          requestAnimationFrame(() => {
            const section = document.getElementById("careers");
            if (section) {
              const rect = section.getBoundingClientRect();
              const offset = 10;
              window.scrollTo({
                top: window.scrollY + rect.top - offset,
                behavior: "smooth"
              });
            }
          });
          return;
        }
        const pageText = link.textContent?.trim();
        if (pageText === "..." || !pageText) return;
        const page = parseInt(pageText, 10);
        if (isNaN(page)) return;
        this.currentPage = page;
        this.renderFiltered();
        requestAnimationFrame(() => {
          const section = document.getElementById("careers");
          if (section) {
            const rect = section.getBoundingClientRect();
            const offset = 10;
            window.scrollTo({
              top: window.scrollY + rect.top - offset,
              behavior: "smooth"
            });
          }
        });
      });
    }
    bindReset() {
      const resetBtn = this.root?.querySelector(
        '[data-careers-el="reset"]'
      );
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          const locationSelect = this.filterForm?.querySelector(
            SELECTORS.filterLocation
          );
          if (locationSelect) {
            locationSelect.value = "";
            locationSelect.dispatchEvent(new Event("change", { bubbles: true }));
          }
          const categorySelect = this.filterForm?.querySelector(
            SELECTORS.filterCategory
          );
          if (categorySelect) {
            categorySelect.value = "";
            categorySelect.dispatchEvent(new Event("change", { bubbles: true }));
          }
          const titleInput = this.filterForm?.querySelector(SELECTORS.filterTitle);
          if (titleInput) {
            titleInput.value = "";
            titleInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
          this.currentPage = 1;
          this.renderFiltered();
        });
      }
    }
    updatePagination(totalPages) {
      const paginationWrap = this.root?.querySelector(SELECTORS.paginationWrap);
      if (!paginationWrap) return;
      const numberWrap = paginationWrap.querySelector(
        ".pagination_number_wrap"
      );
      if (!numberWrap) return;
      if (totalPages > 1) {
        paginationWrap.classList.remove("hide");
        numberWrap.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
          const link = document.createElement("a");
          link.href = "#";
          link.className = "pagination_number_link";
          link.textContent = i.toString();
          if (i === this.currentPage) {
            link.classList.add("active");
          }
          numberWrap.appendChild(link);
        }
        const prevEl = paginationWrap.firstElementChild;
        const nextEl = paginationWrap.lastElementChild;
        if (prevEl) {
          if (this.currentPage === 1) {
            prevEl.classList.add("is-list-pagination-disabled");
          } else {
            prevEl.classList.remove("is-list-pagination-disabled");
          }
        }
        if (nextEl) {
          if (this.currentPage === totalPages) {
            nextEl.classList.add("is-list-pagination-disabled");
          } else {
            nextEl.classList.remove("is-list-pagination-disabled");
          }
        }
      } else {
        paginationWrap.classList.add("hide");
        const prevEl = paginationWrap.firstElementChild;
        const nextEl = paginationWrap.lastElementChild;
        if (prevEl) prevEl.classList.remove("is-list-pagination-disabled");
        if (nextEl) nextEl.classList.remove("is-list-pagination-disabled");
      }
    }
    renderFiltered() {
      if (!this.jobList || !this.itemTemplate) return;
      const { location: location2, category, title } = this.readFilterInputs();
      const pool = this.jobsAfterMode();
      const allVisible = filterJobs(pool, location2, category, title);
      const totalItems = allVisible.length;
      const totalPages = Math.ceil(totalItems / this.itemsPerPage);
      this.currentPage = Math.min(this.currentPage, totalPages || 1);
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const visible = allVisible.slice(startIndex, endIndex);
      this.jobList.innerHTML = "";
      for (const job of visible) {
        const item = this.itemTemplate.cloneNode(true);
        populateCareerItem(item, job);
        this.jobList.appendChild(item);
      }
      const emptyEl = this.root?.querySelector(SELECTORS.empty);
      if (emptyEl) {
        if (visible.length === 0) {
          emptyEl.classList.remove("hide");
        } else {
          emptyEl.classList.add("hide");
        }
      }
      this.updatePagination(totalPages);
      window.dispatchEvent(
        new CustomEvent("jobboard:filtered", {
          detail: {
            total: this.jobs.length,
            pool: pool.length,
            visible: totalItems,
            page: this.currentPage,
            totalPages,
            location: location2,
            category,
            title,
            mode: this.listMode,
            city: this.cityParsed
          }
        })
      );
    }
    jobsAfterMode() {
      if (this.listMode === "all") return this.jobs;
      if (this.listMode === "cities" && this.cityParsed) {
        return this.jobs.filter((job) => {
          const loc = getLocationLabel(job).toLowerCase();
          const cityMatch = loc.includes(this.cityParsed.citySlug.toLowerCase());
          const stateMatch = loc.includes(this.cityParsed.stateCode);
          return cityMatch && stateMatch;
        });
      }
      if (this.listMode === "interns") {
        return this.jobs.filter((job) => {
          const jobType = job.jobType?.descriptor?.toLowerCase() ?? "";
          return jobType.includes("intern") || job.title.toLowerCase().includes("intern");
        });
      }
      return this.jobs;
    }
    async loadJobs() {
      try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const raw = await response.json();
        const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.jobPostings) ? raw.jobPostings : [];
        this.jobs = arr;
      } catch (error) {
        console.error("[JobBoard] Failed to fetch jobs:", error);
        this.jobs = [];
      }
    }
    updateLocationCategories() {
      const locationItems = document.querySelectorAll(".locations-map_list_item");
      const locationData = {};
      for (const item of locationItems) {
        const titleEl = item.querySelector("[data-city]");
        if (!titleEl) {
          console.error(`[JobBoard] Missing [data-city] in .locations-map_list_item`);
          continue;
        }
        const locationName = titleEl.getAttribute("data-city")?.trim();
        if (!locationName) {
          console.error(`[JobBoard] Empty location name in .locations-map_list_item`);
          continue;
        }
        const matchingJobs = this.jobs.filter((job) => matchesLocation(job, locationName));
        const categories = /* @__PURE__ */ new Set();
        for (const job of matchingJobs) {
          const cat = getCategory(job);
          if (cat && cat !== "General") categories.add(cat);
        }
        locationData[locationName] = Array.from(categories).sort();
        const categoryContainer = item.querySelector("[data-city]");
        if (!categoryContainer) {
          console.error(`[JobBoard] Missing category container in .locations-map_list_item`);
          continue;
        }
        categoryContainer.innerHTML = "";
        for (const cat of Array.from(categories).sort()) {
          const categoryElement = document.createElement("div");
          categoryElement.setAttribute("data-category", cat);
          categoryElement.setAttribute("fs-list-field", "job-category");
          categoryElement.textContent = cat;
          categoryContainer.appendChild(categoryElement);
        }
      }
      window.dispatchEvent(
        new CustomEvent("locationCategoriesUpdated", {
          detail: locationData
        })
      );
    }
    async refresh() {
      if (!this.jobList || !this.itemTemplate) return;
      this.currentPage = 1;
      await this.loadJobs();
      if (window.location.pathname === "/about/locations") {
        this.updateLocationCategories();
      }
      this.renderFiltered();
      window.dispatchEvent(
        new CustomEvent("jobboard:rendered", {
          detail: {
            count: this.jobs.length,
            mode: this.listMode,
            city: this.cityParsed
          }
        })
      );
    }
  };
  window.refreshJobBoard = null;

  // src/index.ts
  window.Webflow ||= [];
  window.Webflow.push(async () => {
    const root = document.querySelector(".careers-list_list_wrap");
    if (root) {
      const jobBoard = new JobBoardController();
      await jobBoard.init();
      window.refreshJobBoard = () => jobBoard.refresh();
    }
  });
})();
//# sourceMappingURL=index.js.map
