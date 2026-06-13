/* CyberShield AI Platform — shared utilities */
"use strict";

const SEV_ORDER  = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const SEV_COLORS = {
  CRITICAL: "var(--critical)",
  HIGH:     "var(--high)",
  MEDIUM:   "var(--medium)",
  LOW:      "var(--low)",
};

function escHtml(s) {
  const d = document.createElement("div");
  d.textContent = String(s ?? "");
  return d.innerHTML;
}

/* POST helper */
async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

/* GET helper */
async function fetchGet(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

/* Risk helpers (URL Shield) */
function riskClass(score) {
  if (score >= 70) return "danger";
  if (score >= 40) return "warn";
  return "safe";
}
function riskColor(score) {
  const prop = score >= 70 ? "--danger" : score >= 40 ? "--warn" : "--safe";
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
}

/* CVE card renderer (shared between CVE Intel and Assets tabs) */
function renderCVECard(item) {
  const r = item.cve ?? item;
  const sim = item.similarity;
  const sev = r.cvss_severity || "UNKNOWN";
  const sevColor = SEV_COLORS[sev] || "var(--muted)";
  const meta = [
    r.year    && `📅 ${r.year}`,
    r.attack_vector && `🎯 ${r.attack_vector}`,
    r.privileges_required && `🔑 PRIV: ${r.privileges_required}`,
    r.user_interaction    && `👤 UI: ${r.user_interaction}`,
    (r.cwes && r.cwes.length) && `🐞 ${r.cwes.slice(0, 2).join(", ")}`,
  ].filter(Boolean).map((s) => `<span>${escHtml(s)}</span>`).join("");
  const simPct = sim != null ? Math.round(sim * 100) : null;
  return `
    <div class="cve-card sev-${sev}">
      <div class="card-head">
        <span class="cve-id">${escHtml(r.id)}</span>
        <div class="badges">
          <span class="badge badge-${sev}">${sev} ${r.cvss_score != null ? r.cvss_score.toFixed(1) : ""}</span>
          ${r.vuln_status ? `<span class="badge badge-muted">${escHtml(r.vuln_status)}</span>` : ""}
          ${simPct != null ? `<span class="badge badge-muted">sim ${simPct}%</span>` : ""}
        </div>
      </div>
      <p class="cve-desc">${escHtml(r.description)}</p>
      <div class="cve-meta">${meta}</div>
      ${simPct != null ? `<div class="sim-bar"><div class="sim-bar-fill" style="width:${simPct}%;background:${sevColor}"></div></div>` : ""}
    </div>`;
}

/* Compact CVE card for asset results (uses AssetMatch schema) */
function renderAssetMatch(m) {
  const sev = m.cvss_severity || "UNKNOWN";
  const sevColor = SEV_COLORS[sev] || "var(--muted)";
  const simPct = Math.round((m.similarity ?? 0) * 100);
  return `
    <div class="cve-card sev-${sev}" style="margin-bottom:0">
      <div class="card-head">
        <span class="cve-id">${escHtml(m.cve_id)}</span>
        <div class="badges">
          <span class="badge badge-${sev}">${sev}${m.cvss_score != null ? " " + m.cvss_score.toFixed(1) : ""}</span>
          <span class="badge badge-muted">sim ${simPct}%</span>
          ${m.attack_vector ? `<span class="badge badge-muted">${escHtml(m.attack_vector)}</span>` : ""}
        </div>
      </div>
      <p class="cve-desc">${escHtml(m.description)}</p>
      <div class="sim-bar"><div class="sim-bar-fill" style="width:${simPct}%;background:${sevColor}"></div></div>
    </div>`;
}
