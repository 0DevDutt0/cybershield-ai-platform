/* CVE Intel tab — semantic CVE search and Ask Claude */
"use strict";

const CVEIntel = (() => {
  let selectedSeverities    = new Set();
  let askSelectedSeverities = new Set();

  function init() {
    /* Severity chips */
    document.querySelectorAll(".sev-chip:not(.ask-sev)").forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("active");
        const sev = chip.dataset.sev;
        selectedSeverities.has(sev) ? selectedSeverities.delete(sev) : selectedSeverities.add(sev);
      });
    });
    document.querySelectorAll(".sev-chip.ask-sev").forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("active");
        const sev = chip.dataset.sev;
        askSelectedSeverities.has(sev) ? askSelectedSeverities.delete(sev) : askSelectedSeverities.add(sev);
      });
    });

    /* Search */
    document.getElementById("cve-search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("cve-search-input").value.trim();
      if (q) doSearch(q);
    });
    document.querySelectorAll(".cve-chip").forEach((chip) =>
      chip.addEventListener("click", () => {
        document.getElementById("cve-search-input").value = chip.dataset.q;
        doSearch(chip.dataset.q);
      })
    );

    /* Ask */
    document.getElementById("cve-ask-btn").addEventListener("click", doAsk);
  }

  async function doSearch(query) {
    const btn = document.getElementById("cve-search-btn");
    btn.disabled = true;
    btn.textContent = "Searching…";
    const area = document.getElementById("cve-search-results");
    area.innerHTML = '<div class="card muted" style="padding:20px">Searching…</div>';

    const body = {
      query,
      k: 15,
      severity:      selectedSeverities.size ? [...selectedSeverities] : null,
      start_year:    parseInt(document.getElementById("cve-year-from").value) || null,
      end_year:      parseInt(document.getElementById("cve-year-to").value)   || null,
      attack_vector: document.getElementById("cve-av-select").value           || null,
      min_cvss:      parseFloat(document.getElementById("cve-min-cvss").value) || null,
      cwe:           document.getElementById("cve-cwe-input").value.trim()    || null,
    };

    try {
      const res = await fetch("/api/cve/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { area.innerHTML = `<div class="card muted">${escHtml(data.detail)}</div>`; return; }
      if (!data.results.length) {
        area.innerHTML = '<div class="card muted" style="padding:20px">No results. Try different terms or remove filters.</div>';
        return;
      }
      area.innerHTML = data.results.map(renderCVECard).join("");
    } catch (err) {
      area.innerHTML = `<div class="card muted">${escHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Search";
    }
  }

  async function doAsk() {
    const question = document.getElementById("cve-ask-input").value.trim();
    if (!question) return;
    const btn = document.getElementById("cve-ask-btn");
    btn.disabled = true;
    btn.textContent = "Thinking…";
    const resultEl = document.getElementById("cve-ask-result");
    resultEl.classList.remove("hidden");
    resultEl.innerHTML = '<div class="answer-panel muted">Retrieving CVEs and synthesising answer…</div>';

    const body = {
      question,
      k:          8,
      severity:   askSelectedSeverities.size ? [...askSelectedSeverities] : null,
      start_year: parseInt(document.getElementById("cve-ask-year-from").value) || null,
      end_year:   parseInt(document.getElementById("cve-ask-year-to").value)   || null,
    };

    try {
      const res = await fetch("/api/cve/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { resultEl.innerHTML = `<div class="answer-panel muted">${escHtml(data.detail)}</div>`; return; }
      const cits = (data.citations || []).map((c) => `<span class="cit-tag">${escHtml(c)}</span>`).join("");
      resultEl.innerHTML = `
        <div class="answer-panel">${escHtml(data.answer)}</div>
        <div class="citations-row">
          <span>Source: <span class="source-tag">${escHtml(data.source)}</span></span>
          ${cits ? `<span>Citations:</span>${cits}` : ""}
          <span class="muted">(${data.retrieved_count || 0} CVEs retrieved)</span>
        </div>
        <div style="margin-top:14px">
          ${(data.retrieved || []).slice(0, 5).map(renderCVECard).join("")}
        </div>`;
    } catch (err) {
      resultEl.innerHTML = `<div class="answer-panel muted">${escHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Ask";
    }
  }

  return { init };
})();

/* CVE stats loader — called from app.js when Stats inner tab is clicked */
async function loadCVEStats() {
  const container = document.getElementById("stats-content");
  try {
    const data = await fetchGet("/api/cve/stats");
    container.dataset.loaded = "1";

    const maxSev  = Math.max(1, ...Object.values(data.by_severity));
    const maxYear = Math.max(1, ...Object.values(data.by_year));
    const maxAV   = Math.max(1, ...Object.values(data.by_attack_vector));

    const sevBars = SEV_ORDER.map((sev) => {
      const count = data.by_severity[sev] || 0;
      const pct   = Math.round((count / maxSev) * 100);
      return `<div class="bar-row">
        <span class="bar-label">${sev}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${SEV_COLORS[sev]}"></div></div>
        <span class="bar-count">${count.toLocaleString()}</span>
      </div>`;
    }).join("");

    const yearBars = Object.entries(data.by_year).sort((a, b) => +a[0] - +b[0]).map(([yr, count]) => {
      const pct = Math.round((count / maxYear) * 100);
      return `<div class="bar-row">
        <span class="bar-label">${yr}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--accent)"></div></div>
        <span class="bar-count">${count.toLocaleString()}</span>
      </div>`;
    }).join("");

    const avBars = Object.entries(data.by_attack_vector).sort((a, b) => b[1] - a[1]).map(([av, count]) => {
      const pct = Math.round((count / maxAV) * 100);
      return `<div class="bar-row">
        <span class="bar-label">${av}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--accent-2)"></div></div>
        <span class="bar-count">${count.toLocaleString()}</span>
      </div>`;
    }).join("");

    const cweRows = (data.top_cwes || []).map(([cwe, count]) =>
      `<div class="cwe-row"><span>${escHtml(cwe)}</span><span class="muted">${count.toLocaleString()}</span></div>`
    ).join("");

    container.innerHTML = `
      <div class="stat-card" style="grid-column:span 2">
        <h4>Index Overview</h4>
        <div class="stat-total">${data.total.toLocaleString()}</div>
        <div class="stat-label">CVEs indexed · ${data.start_year}–${data.end_year} · ${data.embed_model}</div>
      </div>
      <div class="stat-card"><h4>By Severity</h4>${sevBars}</div>
      <div class="stat-card"><h4>By Year</h4>${yearBars}</div>
      <div class="stat-card"><h4>By Attack Vector</h4>${avBars}</div>
      <div class="stat-card"><h4>Top CWEs</h4>${cweRows}</div>`;
  } catch (err) {
    container.innerHTML = `<div class="card muted">${escHtml(err.message)}</div>`;
  }
}
