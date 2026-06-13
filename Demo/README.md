# Demo — CyberShield AI Platform

Three ways to explore the platform, from quickest to most complete.

---

## Option 1 — Python Demo Script (Recommended)

Runs all 5 features end-to-end against your local server and prints colour-coded results.

```bash
# Terminal 1 — start the server
platform serve

# Terminal 2 — run the demo
python Demo/demo.py
```

Run only specific features:
```bash
python Demo/demo.py --features url cve
python Demo/demo.py --features threat assets redteam
python Demo/demo.py --features health url
```

**What you'll see:**

```
  ──────────────────────────────────────────────────────────────
  PLATFORM HEALTH CHECK
  ──────────────────────────────────────────────────────────────
  ✓ Platform status      ok
  ✓ URL Shield           ready
  ✓ CVE Index            352,841 CVEs loaded
  ✓ LLM                  enabled

  ──────────────────────────────────────────────────────────────
  1 · URL SHIELD — Phishing Detection
  ──────────────────────────────────────────────────────────────
  ▶ Single URL analysis

    http://paypal-secure-login.xyz/verify?token=abc123
    Score: 87/100  ████████░░  LIKELY PHISHING
    ↳ [HIGH] Suspicious TLD
    ↳ [HIGH] Suspicious keyword in domain
  ...
```

---

## Option 2 — VS Code REST Client

Open `Demo/demo_requests.http` in VS Code with the [REST Client extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) installed.

Click **Send Request** above any block to fire it individually. No Postman needed.

Covers all endpoints:
- `GET /api/health`
- All URL Shield endpoints (`/api/url/*`)
- All CVE Intel endpoints (`/api/cve/*`)
- Threat narratives and IR playbooks (`/api/threat/*`)
- Asset correlation (`/api/assets/correlate`)
- Red Team generation (`/api/redteam/generate`)

---

## Option 3 — Browser Dashboard

Open **http://localhost:8000** after starting the server. The full 5-tab interactive UI is available — no tools needed.

---

## Sample Outputs

See `Demo/sample_outputs.md` for real example request/response pairs for every feature, so you know what to expect before running.

---

## Prerequisites

The server must be running and both subsystems must be initialised:

```bash
# One-time setup (run once, not every time)
platform url train          # trains the phishing ML model (~30 seconds)
platform cve index          # builds the FAISS CVE index (~10-15 minutes)

# Start the server (every time)
platform serve
```

If the CVE index hasn't been built, CVE Intel, Threat Intel, Asset Correlation, and Red Team annotation features will fall back to template responses (no LLM).
