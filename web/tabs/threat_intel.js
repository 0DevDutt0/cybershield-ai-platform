/* Threat Intel tab — narrative generation and IR playbook */
"use strict";

const ThreatIntel = (() => {

  function init() {
    document.getElementById("narrative-btn").addEventListener("click", doNarrative);
    document.getElementById("playbook-btn").addEventListener("click", doPlaybook);
  }

  async function doNarrative() {
    const cveId = document.getElementById("narrative-cve-id").value.trim() || null;
    const desc  = document.getElementById("narrative-desc").value.trim() || null;
    if (!cveId && !desc) { alert("Enter a CVE ID or threat description."); return; }

    const btn = document.getElementById("narrative-btn");
    btn.disabled = true;
    btn.textContent = "Generating…";
    const result = document.getElementById("narrative-result");
    result.classList.remove("hidden");
    result.innerHTML = '<div class="card muted" style="padding:20px">Retrieving CVE context and generating narrative…</div>';

    try {
      const data = await api("/api/threat/narrative", { cve_id: cveId, description: desc });
      const swTags = (data.affected_software || [])
        .map((s) => `<span class="tag-soft">${escHtml(s)}</span>`).join("");
      const cits = (data.citations || [])
        .map((c) => `<span class="cit-tag">${escHtml(c)}</span>`).join("");

      result.innerHTML = `
        <div class="narrative-section">
          <h4>Plain English</h4>
          <p>${escHtml(data.plain_english)}</p>
        </div>
        <div class="narrative-section">
          <h4>Attack Surface</h4>
          <p>${escHtml(data.attack_surface)}</p>
        </div>
        <div class="narrative-section">
          <h4>Business Impact</h4>
          <p>${escHtml(data.business_impact)}</p>
        </div>
        <div class="narrative-section">
          <h4>Affected Software</h4>
          <div class="tags">${swTags || '<span class="muted">Unknown</span>'}</div>
        </div>
        <div style="margin-top:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap">
          <span class="source-tag">${escHtml(data.source)}</span>
          ${cits ? `<span class="muted" style="font-size:12px">Citations:</span>${cits}` : ""}
        </div>`;
    } catch (err) {
      result.innerHTML = `<div class="card muted">${escHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate Narrative";
    }
  }

  async function doPlaybook() {
    const cvesRaw = document.getElementById("playbook-cves").value.trim();
    const cveIds  = cvesRaw ? cvesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const desc    = document.getElementById("playbook-desc").value.trim() || null;
    const org     = document.getElementById("playbook-org").value.trim() || null;
    if (!cveIds.length && !desc) { alert("Enter at least one CVE ID or a threat description."); return; }

    const btn = document.getElementById("playbook-btn");
    btn.disabled = true;
    btn.textContent = "Generating…";
    const result = document.getElementById("playbook-result");
    result.classList.remove("hidden");
    result.innerHTML = '<div class="card muted" style="padding:20px">Generating incident response playbook…</div>';

    try {
      const data = await api("/api/threat/playbook", {
        cve_ids: cveIds,
        threat_description: desc,
        organization_context: org,
      });
      const phaseTags = (data.phases || [])
        .map((p) => `<span class="phase-tag">${escHtml(p)}</span>`).join("");

      result.innerHTML = `
        <h4 style="margin:0 0 10px; color:var(--text)">${escHtml(data.title)}</h4>
        <div class="playbook-phases">${phaseTags}</div>
        <div style="margin-bottom:8px; display:flex; gap:8px; align-items:center">
          <span class="source-tag">${escHtml(data.source)}</span>
          ${data.cve_references.length ? `<span class="muted" style="font-size:12px">CVEs: ${data.cve_references.map(escHtml).join(", ")}</span>` : ""}
        </div>
        <pre class="playbook-content">${escHtml(data.markdown)}</pre>`;
    } catch (err) {
      result.innerHTML = `<div class="card muted">${escHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate Playbook";
    }
  }

  return { init };
})();
