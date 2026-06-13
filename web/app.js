/* CyberShield AI Platform — tab router & global health check */
"use strict";

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 52; // r=52

/* ── Global health check ───────────────────────────────────────────────────── */
async function checkHealth() {
  const pill = document.getElementById("status-pill");
  const idx  = document.getElementById("index-size");
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error();
    const d = await res.json();
    const llmTag = d.llm_enabled ? " · Claude" : "";
    const urlTag = d.url_shield ? "" : " · URL⚠";
    const cveTag = d.cve_intel  ? "" : " · CVE⚠";
    pill.textContent = `● online${llmTag}${urlTag}${cveTag}`;
    pill.className = "pill pill-ok";
    if (d.index_total > 0) {
      idx.textContent = `${(d.index_total / 1000).toFixed(0)}k CVEs`;
      idx.classList.remove("hidden");
    }
  } catch {
    pill.textContent = "● offline";
    pill.className = "pill pill-down";
  }
}

/* ── Tab routing ───────────────────────────────────────────────────────────── */
const tabInited = {};

function activateTab(tabEl) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
  tabEl.classList.add("active");
  const name = tabEl.dataset.tab;
  const panel = document.getElementById(`tab-${name}`);
  if (panel) panel.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  checkHealth();

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab));
  });

  /* Inner tab routing (shared pattern) */
  document.querySelectorAll(".tab-inner").forEach((tab) => {
    tab.addEventListener("click", () => {
      const parent = tab.closest(".tab-panel");
      parent.querySelectorAll(".tab-inner").forEach((t) => t.classList.remove("active"));
      parent.querySelectorAll(".inner-panel").forEach((p) => p.classList.add("hidden"));
      tab.classList.add("active");
      const panel = parent.querySelector(`#${tab.dataset.inner}`);
      if (panel) panel.classList.remove("hidden");
      /* Lazy-load stats */
      if (tab.dataset.inner === "stats-panel") {
        const content = document.getElementById("stats-content");
        if (content && !content.dataset.loaded) loadCVEStats();
      }
    });
  });

  /* URL Shield wiring */
  URLShield.init(GAUGE_CIRCUMFERENCE);

  /* CVE Intel wiring */
  CVEIntel.init();

  /* Threat Intel wiring */
  ThreatIntel.init();

  /* Assets wiring */
  Assets.init();

  /* Red Team wiring */
  RedTeam.init();
});
