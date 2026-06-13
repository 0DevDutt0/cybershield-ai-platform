"""
CyberShield AI Platform — Interactive Demo Script

Demonstrates all 5 platform features against a running local server.

Usage:
    # Start the server in one terminal:
    platform serve

    # Run this script in another terminal:
    python Demo/demo.py

    # Run only specific features:
    python Demo/demo.py --features url cve threat
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000"

# ── ANSI colours ─────────────────────────────────────────────────────────────

RESET  = "\033[0m"
BOLD   = "\033[1m"
RED    = "\033[91m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
WHITE  = "\033[97m"
DIM    = "\033[2m"


def c(text: str, colour: str) -> str:
    return f"{colour}{text}{RESET}"


def header(title: str) -> None:
    width = 65
    print()
    print(c("─" * width, CYAN))
    print(c(f"  {title}", BOLD + WHITE))
    print(c("─" * width, CYAN))


def ok(label: str, value: str = "") -> None:
    tick = c("✓", GREEN)
    print(f"  {tick} {c(label, WHITE)}{('  ' + c(value, DIM)) if value else ''}")


def warn(label: str, value: str = "") -> None:
    bang = c("!", YELLOW)
    print(f"  {bang} {c(label, YELLOW)}{('  ' + c(value, DIM)) if value else ''}")


def err(label: str) -> None:
    cross = c("✗", RED)
    print(f"  {cross} {c(label, RED)}")


def section(title: str) -> None:
    print(f"\n  {c('▶', CYAN)} {c(title, BOLD)}")


# ── HTTP helper ───────────────────────────────────────────────────────────────

def post(path: str, payload: dict) -> dict | None:
    url = BASE_URL + path
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        err(f"HTTP {e.code} from {path}: {body[:200]}")
        return None
    except Exception as e:
        err(f"Request failed ({path}): {e}")
        return None


def get(path: str) -> dict | None:
    url = BASE_URL + path
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except Exception as e:
        err(f"Request failed ({path}): {e}")
        return None


# ── Feature demos ─────────────────────────────────────────────────────────────

def demo_health() -> bool:
    header("PLATFORM HEALTH CHECK")
    result = get("/api/health")
    if not result:
        err("Server not reachable. Is it running? (platform serve)")
        return False

    status = result.get("status", "unknown")
    url_ready = result.get("url_shield_ready", False)
    cve_loaded = result.get("cve_index_loaded", False)
    llm_on = result.get("llm_enabled", False)
    cve_count = result.get("cve_count", 0)

    print()
    ok("Platform status", status)
    ok("URL Shield", "ready" if url_ready else "not ready — run: platform url train")
    ok("CVE Index", f"{cve_count:,} CVEs loaded" if cve_loaded else "not loaded — run: platform cve index")
    ok("LLM", "enabled" if llm_on else "disabled — check GROQ_API_KEY in .env")
    return True


def demo_url_shield() -> None:
    header("1 · URL SHIELD — Phishing Detection")

    test_cases = [
        ("https://github.com/login",                          "Legitimate"),
        ("http://paypal-secure-login.xyz/verify?token=abc",   "Phishing"),
        ("http://192.168.0.1/bank/login.php",                 "Suspicious"),
        ("http://amaz0n-account-suspended.tk/reactivate",     "Phishing"),
        ("https://stackoverflow.com/questions",               "Legitimate"),
    ]

    section("Single URL analysis")
    for url, expected in test_cases:
        result = post("/api/url/predict", {"url": url})
        if not result:
            continue
        score   = result.get("risk_score", 0)
        verdict = result.get("verdict", "UNKNOWN")
        colour  = RED if score >= 60 else (YELLOW if score >= 30 else GREEN)
        bar     = c("█" * (score // 10) + "░" * (10 - score // 10), colour)
        print(f"\n    {c(url[:55], DIM)}")
        print(f"    Score: {c(str(score), colour)}/100  {bar}  {c(verdict, colour)}")
        signals = result.get("signals", [])
        for sig in signals[:2]:
            print(f"    {c('↳', DIM)} [{sig['severity']}] {sig['label']}")

    section("Batch analysis (5 URLs at once)")
    batch_result = post("/api/url/predict/batch", {
        "urls": [url for url, _ in test_cases]
    })
    if batch_result:
        results = batch_result.get("results", [])
        ok(f"Processed {len(results)} URLs in one request")
        high_risk = [r for r in results if r.get("risk_score", 0) >= 60]
        ok(f"High-risk URLs detected: {len(high_risk)}/{len(results)}")


def demo_cve_intel() -> None:
    header("2 · CVE INTELLIGENCE — Semantic Vulnerability Search")

    section("Natural language CVE search")
    result = post("/api/cve/search", {
        "query": "remote code execution Java logging library",
        "k": 3,
        "severity": ["CRITICAL", "HIGH"],
    })
    if result:
        hits = result.get("results", [])
        ok(f"Found {result.get('total', 0)} matching CVEs")
        for hit in hits:
            cve  = hit["cve"]
            sim  = hit["similarity"]
            sev  = cve.get("cvss_severity", "?")
            score = cve.get("cvss_score", "?")
            colour = RED if sev == "CRITICAL" else YELLOW
            print(f"\n    {c(cve['id'], BOLD)}  [{c(sev, colour)} {score}]  similarity={sim:.3f}")
            print(f"    {c(cve['description'][:100] + '...', DIM)}")

    section("Ask Claude a security question (RAG)")
    result = post("/api/cve/ask", {
        "question": "What are the most critical Apache vulnerabilities in the last 3 years?",
        "k": 5,
    })
    if result:
        answer  = result.get("answer", "")
        cites   = result.get("citations", [])
        source  = result.get("source", "template")
        ok(f"Answer generated via: {source}")
        ok(f"Citations: {', '.join(cites[:5]) if cites else 'none'}")
        print(f"\n    {c(answer[:300] + ('...' if len(answer) > 300 else ''), DIM)}")


def demo_threat_intel() -> None:
    header("3 · THREAT INTELLIGENCE — Narratives & Playbooks")

    section("Threat narrative for CVE-2021-44228 (Log4Shell)")
    result = post("/api/threat/narrative", {"cve_id": "CVE-2021-44228"})
    if result:
        source = result.get("source", "template")
        ok(f"Narrative generated via: {source}")
        print()
        for field, label in [
            ("plain_english",   "Plain English"),
            ("attack_surface",  "Attack Surface"),
            ("business_impact", "Business Impact"),
        ]:
            text = result.get(field, "")
            print(f"    {c(label + ':', CYAN)}")
            print(f"    {c(text[:180] + ('...' if len(text) > 180 else ''), DIM)}")
            print()
        affected = result.get("affected_software", [])
        ok(f"Affected software: {', '.join(affected[:4])}")

    section("Incident response playbook")
    result = post("/api/threat/playbook", {
        "cve_ids": ["CVE-2021-44228"],
        "organization_context": "e-commerce company running Java microservices",
    })
    if result:
        source = result.get("source", "template")
        phases = result.get("phases", [])
        ok(f"Playbook generated via: {source}")
        ok(f"Phases: {' → '.join(phases)}")
        markdown = result.get("markdown", "")
        checklist_items = markdown.count("- [ ]")
        ok(f"Actionable checklist items: {checklist_items}")


def demo_assets() -> None:
    header("4 · ASSET CORRELATION — CVE Matching")

    section("Correlating software inventory against CVE index")
    result = post("/api/assets/correlate", {
        "assets": [
            {"name": "Apache Log4j",  "version": "2.14.1", "asset_type": "library"},
            {"name": "Apache Tomcat", "version": "9.0.54",  "asset_type": "web_server"},
            {"name": "OpenSSL",       "version": "1.1.1",   "asset_type": "library"},
        ],
        "k_per_asset": 5,
        "min_cvss": 7.0,
        "summarize": True,
    })
    if result:
        total_unique  = result.get("total_unique_cves", 0)
        critical_count = result.get("critical_count", 0)
        high_count    = result.get("high_count", 0)

        ok(f"Total unique CVEs matched: {total_unique}")
        ok(f"CRITICAL severity: {c(str(critical_count), RED)}")
        ok(f"HIGH severity: {c(str(high_count), YELLOW)}")

        results = result.get("results", [])
        for asset_result in results:
            asset   = asset_result.get("asset", {})
            matches = asset_result.get("matches", [])
            highest = asset_result.get("highest_severity", "NONE")
            colour  = RED if highest == "CRITICAL" else (YELLOW if highest == "HIGH" else GREEN)
            print(f"\n    {c(asset.get('name', '?'), BOLD)} {c(asset.get('version', ''), DIM)}")
            print(f"    Highest severity: {c(highest, colour)}  |  {len(matches)} CVEs matched")

        summary = result.get("overall_summary", "")
        if summary:
            print(f"\n    {c('CISO Summary (excerpt):', CYAN)}")
            print(f"    {c(summary[:250] + '...', DIM)}")


def demo_redteam() -> None:
    header("5 · RED TEAM — Adversarial URL Generation")
    warn("For authorized penetration testing ONLY")

    section("Generating phishing variants for example.com")
    result = post("/api/redteam/generate", {
        "legitimate_domain": "example.com",
        "techniques": ["homoglyphs", "subdomain", "tld_swap", "typos"],
        "count_per_technique": 2,
        "authorized_by": "Demo Script / Internal Testing",
    })
    if result:
        variants = result.get("variants", [])
        ok(f"Generated {len(variants)} adversarial variants")
        print()

        by_risk: dict[str, list] = {"HIGH": [], "MEDIUM": [], "LOW": []}
        for v in variants:
            by_risk.setdefault(v.get("risk_level", "LOW"), []).append(v)

        for risk_level, colour in [("HIGH", RED), ("MEDIUM", YELLOW), ("LOW", GREEN)]:
            for v in by_risk.get(risk_level, []):
                technique = v.get("technique", "?")
                variant   = v.get("variant", "?")
                expl      = v.get("explanation", "")[:80]
                print(f"    [{c(risk_level, colour)}] {c(variant, BOLD)}  ({technique})")
                print(f"           {c(expl + '...', DIM)}")
                print()

        summary = result.get("technique_summary", "")
        if summary:
            print(f"  {c('Threat summary:', CYAN)}")
            print(f"  {c(summary[:200] + '...', DIM)}")


# ── Entry point ───────────────────────────────────────────────────────────────

ALL_FEATURES = ["health", "url", "cve", "threat", "assets", "redteam"]

FEATURE_MAP = {
    "health":  demo_health,
    "url":     demo_url_shield,
    "cve":     demo_cve_intel,
    "threat":  demo_threat_intel,
    "assets":  demo_assets,
    "redteam": demo_redteam,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="CyberShield AI Platform demo")
    parser.add_argument(
        "--features",
        nargs="+",
        choices=ALL_FEATURES,
        default=ALL_FEATURES,
        help="Which features to demo (default: all)",
    )
    args = parser.parse_args()

    print()
    print(c("  ██████╗██╗   ██╗██████╗ ███████╗██████╗ ███████╗██╗  ██╗██╗███████╗██╗     ██████╗ ", CYAN))
    print(c("  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║██║██╔════╝██║     ██╔══██╗", CYAN))
    print(c("  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝███████╗███████║██║█████╗  ██║     ██║  ██║", CYAN))
    print(c("  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗╚════██║██╔══██║██║██╔══╝  ██║     ██║  ██║", CYAN))
    print(c("  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║███████║██║  ██║██║███████╗███████╗██████╔╝", CYAN))
    print(c("   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝ ", CYAN))
    print()
    print(c("  AI Platform v2.0 — Feature Demo", DIM))
    print(c(f"  Target: {BASE_URL}", DIM))
    print()

    # Always run health first
    if "health" in args.features:
        if not demo_health():
            sys.exit(1)

    for feature in args.features:
        if feature == "health":
            continue
        time.sleep(0.3)
        FEATURE_MAP[feature]()

    print()
    print(c("─" * 65, CYAN))
    print(c("  Demo complete.", GREEN + BOLD))
    print(c(f"  Open {BASE_URL} in your browser to use the dashboard.", DIM))
    print(c("─" * 65, CYAN))
    print()


if __name__ == "__main__":
    main()
