/* Red Team tab — adversarial URL generation */
"use strict";

const RedTeam = (() => {

  function getTechniques() {
    return [...document.querySelectorAll(".tech-chip input:checked")].map((cb) => cb.value);
  }

  function renderResults(data) {
    const container = document.getElementById("rt-result");
    const rowsHtml = data.variants.map((v) => `
      <tr>
        <td>${escHtml(v.variant)}</td>
        <td><span class="badge badge-muted">${escHtml(v.technique)}</span></td>
        <td class="rl-${v.risk_level}">${v.risk_level}</td>
        <td style="font-size:12.5px; color:var(--muted)">${escHtml(v.explanation)}</td>
      </tr>`).join("");

    container.innerHTML = `
      <div class="rt-disclaimer">⚠️ ${escHtml(data.disclaimer)}</div>
      <div class="rt-summary">${escHtml(data.technique_summary)}</div>
      <div style="overflow-x:auto">
        <table class="rt-table">
          <thead>
            <tr><th>Variant</th><th>Technique</th><th>Risk</th><th>Explanation</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <div style="margin-top:10px; font-size:12px; color:var(--muted)">
        Authorized by: <strong>${escHtml(data.authorized_by)}</strong>
      </div>`;
  }

  async function generate() {
    const domain = document.getElementById("rt-domain").value.trim();
    const authBy = document.getElementById("rt-authorized-by").value.trim();
    const techniques = getTechniques();

    if (!domain)   { alert("Enter a legitimate domain."); return; }
    if (!authBy)   { alert("Enter the authorizing official or engagement reference."); return; }
    if (!techniques.length) { alert("Select at least one technique."); return; }

    const btn = document.getElementById("rt-generate-btn");
    btn.disabled = true;
    btn.textContent = "Generating…";
    const container = document.getElementById("rt-result");
    container.classList.remove("hidden");
    container.innerHTML = '<div class="card muted" style="padding:20px">Generating adversarial variants…</div>';

    try {
      const data = await api("/api/redteam/generate", {
        legitimate_domain:    domain,
        techniques,
        count_per_technique:  parseInt(document.getElementById("rt-count").value) || 3,
        authorized_by:        authBy,
      });
      renderResults(data);
    } catch (err) {
      container.innerHTML = `<div class="card muted">${escHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate Variants";
    }
  }

  function init() {
    document.getElementById("rt-generate-btn").addEventListener("click", generate);
  }

  return { init };
})();
