/* URL Shield tab — phishing URL analysis */
"use strict";

const URLShield = (() => {
  let lastUrl = null;

  function animateCount(el, target) {
    const start = performance.now();
    const from = parseInt(el.textContent, 10) || 0;
    function step(now) {
      const t = Math.min((now - start) / 700, 1);
      el.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function renderResult(data, circumference) {
    lastUrl = data.url;
    const result = document.getElementById("url-result");
    result.classList.remove("hidden");

    const score = data.risk_score;
    const arc   = document.getElementById("gauge-arc");
    arc.style.stroke = riskColor(score);
    arc.style.strokeDashoffset = circumference * (1 - score / 100);
    animateCount(document.getElementById("gauge-score"), score);

    const badge = document.getElementById("verdict-badge");
    badge.textContent = data.verdict;
    badge.className = "verdict-badge v-" + riskClass(score);
    document.getElementById("verdict-url").textContent = data.url;
    document.getElementById("meta-prob").textContent = Math.round(data.probability * 100) + "%";
    document.getElementById("meta-conf").textContent = Math.round(data.confidence * 100) + "%";

    const list = document.getElementById("signals-list");
    list.innerHTML = "";
    if (!data.signals.length) {
      list.innerHTML = '<li class="no-signals">✓ No classic phishing indicators detected.</li>';
    } else {
      for (const s of data.signals) {
        const li = document.createElement("li");
        li.className = "li-" + s.severity;
        li.innerHTML = `
          <span class="sev sev-${s.severity}">${s.severity}</span>
          <div>
            <div class="signal-label">${escHtml(s.label)}</div>
            <div class="signal-detail">${escHtml(s.detail)}</div>
          </div>`;
        list.appendChild(li);
      }
    }

    const expText = document.getElementById("url-explain-text");
    const expSrc  = document.getElementById("url-explain-source");
    const expBtn  = document.getElementById("url-explain-btn");
    if (data.explanation) {
      expText.textContent = data.explanation.text;
      expSrc.textContent  = data.explanation.source === "llm" ? "Claude" : "rule-based";
      expSrc.classList.remove("hidden");
      expBtn.classList.add("hidden");
    } else {
      expText.textContent = "Click below for a plain-English breakdown of this verdict.";
      expSrc.classList.add("hidden");
      expBtn.classList.remove("hidden");
    }
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function analyze(url, circumference) {
    const btn = document.getElementById("url-analyze-btn");
    btn.disabled = true;
    btn.textContent = "Analysing…";
    try {
      const data = await api("/api/url/predict", { url });
      renderResult(data, circumference);
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Analyse";
    }
  }

  async function fetchExplanation() {
    if (!lastUrl) return;
    const btn = document.getElementById("url-explain-btn");
    btn.disabled = true;
    btn.textContent = "Thinking…";
    try {
      const data = await api("/api/url/explain", { url: lastUrl });
      document.getElementById("url-explain-text").textContent = data.explanation.text;
      const src = document.getElementById("url-explain-source");
      src.textContent = data.explanation.source === "llm" ? "Claude" : "rule-based";
      src.classList.remove("hidden");
      btn.classList.add("hidden");
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Get AI explanation";
    }
  }

  async function analyzeBatch() {
    const urls = document.getElementById("batch-input").value
      .split("\n").map((u) => u.trim()).filter(Boolean);
    if (!urls.length) return;
    const btn = document.getElementById("batch-btn");
    btn.disabled = true;
    btn.textContent = "Analysing…";
    try {
      const data = await api("/api/url/predict/batch", { urls: urls.slice(0, 100) });
      const summary = document.getElementById("batch-summary");
      summary.classList.remove("hidden");
      summary.innerHTML = `
        <div class="stat"><b>${data.summary.total}</b><span>analysed</span></div>
        <div class="stat"><b style="color:var(--danger)">${data.summary.phishing}</b><span>phishing</span></div>
        <div class="stat"><b style="color:var(--safe)">${data.summary.benign}</b><span>benign</span></div>
        <div class="stat"><b>${data.summary.average_risk}</b><span>avg risk</span></div>`;
      const table = document.getElementById("batch-table");
      const tbody = table.querySelector("tbody");
      tbody.innerHTML = "";
      for (const r of data.results) {
        const tr = document.createElement("tr");
        const topSignal = r.signals.length ? r.signals[0].label : "—";
        tr.innerHTML = `
          <td class="url" title="${escHtml(r.url)}">${escHtml(r.url)}</td>
          <td><span class="tag v-${riskClass(r.risk_score)}">${r.verdict}</span></td>
          <td>${r.risk_score}</td>
          <td>${escHtml(topSignal)}</td>`;
        tbody.appendChild(tr);
      }
      table.classList.remove("hidden");
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Analyse all";
    }
  }

  function init(circumference) {
    document.getElementById("url-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const url = document.getElementById("url-input").value.trim();
      if (url) analyze(url, circumference);
    });
    document.querySelectorAll(".url-chip").forEach((chip) =>
      chip.addEventListener("click", () => {
        document.getElementById("url-input").value = chip.dataset.url;
        analyze(chip.dataset.url, circumference);
      })
    );
    document.getElementById("url-explain-btn").addEventListener("click", fetchExplanation);
    document.getElementById("batch-btn").addEventListener("click", analyzeBatch);
  }

  return { init };
})();
