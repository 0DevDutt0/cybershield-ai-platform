/* Assets tab — CVE-to-asset correlation */
"use strict";

const Assets = (() => {
  let assetCount = 1;

  function makeAssetRow(idx) {
    const div = document.createElement("div");
    div.className = "asset-row";
    div.dataset.idx = idx;
    div.innerHTML = `
      <input class="asset-name" type="text" placeholder="e.g. Apache Tomcat" />
      <input class="asset-version" type="text" placeholder="9.0.54" style="width:100px" />
      <select class="asset-type">
        <option value="">Type…</option>
        <option value="library">library</option>
        <option value="web_server">web server</option>
        <option value="database">database</option>
        <option value="os">OS</option>
        <option value="framework">framework</option>
        <option value="container">container</option>
      </select>
      <button class="remove-asset ghost-btn small" title="Remove">✕</button>`;
    div.querySelector(".remove-asset").addEventListener("click", () => div.remove());
    return div;
  }

  function getAssets() {
    const rows = document.querySelectorAll(".asset-row");
    return [...rows].map((row) => ({
      name:       row.querySelector(".asset-name").value.trim(),
      version:    row.querySelector(".asset-version").value.trim() || null,
      asset_type: row.querySelector(".asset-type").value || null,
    })).filter((a) => a.name);
  }

  function renderResults(data) {
    const container = document.getElementById("correlate-result");
    const parts = [];

    /* Stats bar */
    parts.push(`
      <div class="correlate-stats">
        <span class="correlate-stat">🔍 ${data.total_unique_cves} unique CVEs</span>
        <span class="correlate-stat" style="color:var(--danger)">🔴 ${data.critical_count} CRITICAL</span>
        <span class="correlate-stat" style="color:var(--high)">🟠 ${data.high_count} HIGH</span>
      </div>`);

    /* CISO summary */
    if (data.overall_summary) {
      parts.push(`
        <div class="ciso-summary">
          <div class="ciso-summary-label">CISO Summary — Claude</div>
          ${escHtml(data.overall_summary)}
        </div>`);
    }

    /* Per-asset cards */
    for (const res of data.results) {
      const a = res.asset;
      const sev = res.highest_severity || "—";
      const sevColor = SEV_COLORS[sev] || "var(--muted)";
      const label = [a.name, a.version, a.asset_type].filter(Boolean).join(" ");
      const matchHtml = res.matches.length
        ? `<div class="asset-cve-list">${res.matches.map(renderAssetMatch).join("")}</div>`
        : `<div class="muted" style="font-size:13px">No CVEs found matching this asset.</div>`;
      parts.push(`
        <div class="asset-card">
          <div class="asset-card-head">
            <span class="asset-name-label">${escHtml(label)}</span>
            ${sev !== "—" ? `<span class="badge badge-${sev}">${sev}</span>` : ""}
          </div>
          ${matchHtml}
        </div>`);
    }

    container.innerHTML = parts.join("");
  }

  async function correlate() {
    const assets = getAssets();
    if (!assets.length) { alert("Add at least one asset."); return; }

    const btn = document.getElementById("correlate-btn");
    btn.disabled = true;
    btn.textContent = "Correlating…";
    const container = document.getElementById("correlate-result");
    container.classList.remove("hidden");
    container.innerHTML = '<div class="card muted" style="padding:20px">Searching CVE index…</div>';

    try {
      const data = await api("/api/assets/correlate", {
        assets,
        k_per_asset: parseInt(document.getElementById("asset-k").value) || 5,
        min_cvss:    parseFloat(document.getElementById("asset-min-cvss").value) || null,
        summarize:   document.getElementById("asset-summarize").checked,
      });
      renderResults(data);
    } catch (err) {
      container.innerHTML = `<div class="card muted">${escHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Correlate";
    }
  }

  function init() {
    /* First row remove button */
    const firstRemove = document.querySelector(".remove-asset");
    if (firstRemove) firstRemove.addEventListener("click", () => firstRemove.closest(".asset-row").remove());

    document.getElementById("add-asset-btn").addEventListener("click", () => {
      assetCount++;
      const list = document.getElementById("asset-list");
      list.appendChild(makeAssetRow(assetCount));
    });
    document.getElementById("correlate-btn").addEventListener("click", correlate);
  }

  return { init };
})();
