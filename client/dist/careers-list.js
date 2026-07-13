"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/careers-list.ts
  var GLOBAL_KEY = "poet_careers-list";
  var ATTRIBUTES_URL = "https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js";
  var SELECT_CUSTOM_URL = "https://cdn.jsdelivr.net/npm/@finsweet/attributes-selectcustom@1/selectcustom.js";
  function getState() {
    window[GLOBAL_KEY] ??= {
      instances: /* @__PURE__ */ new Map(),
      loaded: false,
      selectCustomLoaded: false
    };
    return window[GLOBAL_KEY];
  }
  function loadAttributes(onReady) {
    const state = getState();
    let script = document.querySelector(`script[src="${ATTRIBUTES_URL}"]`);
    if (script) {
      script.setAttribute("fs-list", "");
      script.setAttribute("fs-formsubmit", "");
      state.loaded = true;
      onReady?.();
      return;
    }
    script = document.createElement("script");
    script.async = true;
    script.type = "module";
    script.setAttribute("data-id", "poet_careers-list_finsweet");
    script.setAttribute("fs-list", "");
    script.setAttribute("fs-formsubmit", "");
    script.src = ATTRIBUTES_URL;
    document.head.append(script);
    script.addEventListener("load", () => {
      state.loaded = true;
      onReady?.();
    });
  }
  function loadSelectCustom(onReady) {
    const state = getState();
    let script = document.querySelector(`script[src="${SELECT_CUSTOM_URL}"]`);
    if (script) {
      state.selectCustomLoaded = true;
      onReady?.();
      return;
    }
    script = document.createElement("script");
    script.defer = true;
    script.setAttribute("data-id", "poet_careers-list_finsweet-selectcustom");
    script.src = SELECT_CUSTOM_URL;
    document.head.append(script);
    script.addEventListener("load", () => {
      state.selectCustomLoaded = true;
      onReady?.();
    });
  }
  function init() {
    const sections = document.querySelectorAll(
      '.careers-list_section, .careers-list_list_wrap, [fs-selectcustom-element="dropdown"]'
    );
    if (!sections.length) return;
    loadAttributes(() => {
      loadSelectCustom(() => {
        const state = getState();
        sections.forEach((section) => {
          if (!state.instances.has(section)) {
            state.instances.set(section, true);
          }
        });
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
/*! [careers-list]: restores Finsweet list/formsubmit and select custom loaders */
//# sourceMappingURL=careers-list.js.map
