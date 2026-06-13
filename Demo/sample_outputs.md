# Sample Outputs — CyberShield AI Platform

Real example responses from each feature so you know what to expect before running the platform.

---

## 1. URL Shield — Phishing Detection

**Request:**
```json
POST /api/url/predict
{ "url": "http://paypal-secure-login.xyz/verify?token=abc123" }
```

**Response:**
```json
{
  "url": "http://paypal-secure-login.xyz/verify?token=abc123",
  "verdict": "LIKELY PHISHING",
  "risk_score": 87,
  "probability": 0.91,
  "confidence": 0.94,
  "signals": [
    {
      "severity": "HIGH",
      "label": "Suspicious TLD",
      "detail": "Domain uses .xyz — a TLD commonly registered for phishing campaigns"
    },
    {
      "severity": "HIGH",
      "label": "Suspicious keyword in domain",
      "detail": "Domain contains 'secure' and 'login' — common social engineering patterns"
    },
    {
      "severity": "MEDIUM",
      "label": "Hyphen in domain",
      "detail": "Domain contains hyphens which are unusual in legitimate brand domains"
    },
    {
      "severity": "LOW",
      "label": "Long URL",
      "detail": "URL length 51 chars exceeds typical legitimate URL patterns"
    }
  ],
  "explanation": {
    "text": "This URL shows multiple strong phishing indicators. The domain 'paypal-secure-login.xyz' mimics PayPal's brand while using a cheap .xyz TLD that PayPal would never use. The combination of 'secure' and 'login' in the domain name is a classic social engineering tactic. Do not enter any credentials — this is almost certainly a credential-harvesting page.",
    "source": "llm"
  }
}
```

---

## 2. CVE Intelligence — Semantic Search

**Request:**
```json
POST /api/cve/search
{
  "query": "remote code execution Java logging library",
  "k": 3,
  "severity": ["CRITICAL"]
}
```

**Response:**
```json
{
  "query": "remote code execution Java logging library",
  "total": 3,
  "results": [
    {
      "cve": {
        "id": "CVE-2021-44228",
        "description": "Apache Log4j2 2.0-beta9 through 2.15.0 (excluding security releases) JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints...",
        "cvss_score": 10.0,
        "cvss_severity": "CRITICAL",
        "attack_vector": "NETWORK",
        "published": "2021-12-10",
        "cwes": ["CWE-917", "CWE-400"]
      },
      "similarity": 0.9312
    },
    {
      "cve": {
        "id": "CVE-2021-45046",
        "description": "Apache Log4j2 Thread Context lookup pattern is vulnerable to RCE in certain non-default configurations...",
        "cvss_score": 9.0,
        "cvss_severity": "CRITICAL",
        "attack_vector": "NETWORK"
      },
      "similarity": 0.8871
    }
  ]
}
```

---

## 3. Threat Intelligence — Narrative

**Request:**
```json
POST /api/threat/narrative
{ "cve_id": "CVE-2021-44228" }
```

**Response:**
```json
{
  "cve_id": "CVE-2021-44228",
  "plain_english": "Log4Shell is one of the most severe vulnerabilities ever discovered. It affects Log4j, a logging tool used by millions of Java applications worldwide. An attacker can trigger it by sending a specially crafted string in any field that gets logged — such as a username, search query, or HTTP header — causing the server to connect to an attacker-controlled computer and execute their code.",
  "attack_surface": "Any internet-facing Java application using Log4j 2.x between versions 2.0-beta9 and 2.15.0 is vulnerable. The attack requires only network access to any input field that is logged. No authentication is required. The attack vector is NETWORK with attack complexity LOW.",
  "business_impact": "Full server compromise leading to data exfiltration, ransomware deployment, or use as a pivot point into internal networks. Financial exposure includes breach notification costs, regulatory fines (GDPR, HIPAA), and reputational damage. Exploitation has been observed in the wild within hours of disclosure.",
  "affected_software": ["Apache Log4j 2.x", "Java applications", "Spring Boot", "Elasticsearch", "VMware products", "Cisco products"],
  "citations": ["CVE-2021-44228"],
  "source": "llm"
}
```

---

## 4. Incident Response Playbook

**Request:**
```json
POST /api/threat/playbook
{
  "cve_ids": ["CVE-2021-44228"],
  "organization_context": "e-commerce company running Java microservices on AWS"
}
```

**Response (markdown excerpt):**
```markdown
# Incident Response Playbook — CVE-2021-44228

> **Scope:** CVE-2021-44228 (Log4Shell) — CVSS 10.0 CRITICAL
> ⚠️ For authorized defensive use only.

## Detection

- [ ] Search application logs for strings containing `${jndi:` or `${${::-j}${::-n}${::-d}${::-i}:`
- [ ] Query WAF and IDS logs for LDAP callback attempts originating from your servers
- [ ] Run `find / -name "log4j*.jar" -o -name "log4j-core*.jar"` on all hosts
- [ ] Check AWS CloudTrail for unusual EC2 or Lambda outbound connections on port 389/636

## Containment

- [ ] Immediately apply Log4j WAF rules (AWS WAF managed rule: `AWSManagedRulesKnownBadInputsRuleSet`)
- [ ] Set JVM flag `-Dlog4j2.formatMsgNoLookups=true` as emergency mitigation
- [ ] Block outbound LDAP (port 389, 636) and RMI (port 1099) at the security group level
- [ ] Isolate any EC2 instances showing outbound callback connections

## Eradication

- [ ] Upgrade Log4j to 2.17.1+ (Java 8) or 2.12.4+ (Java 7) in all services
- [ ] Rebuild all Docker images from patched base and redeploy
- [ ] Rotate all credentials and API keys accessible from affected services
- [ ] Remove any webshells or backdoors planted during exploitation window

## Recovery

- [ ] Restore affected services from pre-incident AMI snapshots where exploitation is confirmed
- [ ] Re-enable services after patch verification with a CVE scanner (Trivy, Grype)
- [ ] Monitor CloudWatch for 72 hours for signs of recurrence or lateral movement

## Lessons Learned

- [ ] Add Log4j version check to CI/CD pipeline (Dependabot or Renovate)
- [ ] Implement egress filtering as standard — outbound LDAP/RMI should never be allowed
- [ ] Conduct tabletop exercise simulating zero-day response within 2 hours of disclosure
```

---

## 5. Asset Correlation

**Request:**
```json
POST /api/assets/correlate
{
  "assets": [
    { "name": "Apache Log4j", "version": "2.14.1", "asset_type": "library" },
    { "name": "OpenSSL", "version": "1.1.1", "asset_type": "library" }
  ],
  "k_per_asset": 3,
  "min_cvss": 8.0,
  "summarize": true
}
```

**Response:**
```json
{
  "results": [
    {
      "asset": { "name": "Apache Log4j", "version": "2.14.1", "asset_type": "library" },
      "highest_severity": "CRITICAL",
      "matches": [
        {
          "cve": { "id": "CVE-2021-44228", "cvss_score": 10.0, "cvss_severity": "CRITICAL" },
          "similarity": 0.931
        }
      ]
    },
    {
      "asset": { "name": "OpenSSL", "version": "1.1.1", "asset_type": "library" },
      "highest_severity": "HIGH",
      "matches": [
        {
          "cve": { "id": "CVE-2022-0778", "cvss_score": 7.5, "cvss_severity": "HIGH" },
          "similarity": 0.874
        }
      ]
    }
  ],
  "total_unique_cves": 6,
  "critical_count": 2,
  "high_count": 4,
  "overall_summary": "The assessed inventory presents significant risk. Apache Log4j 2.14.1 is directly affected by the Log4Shell vulnerability (CVE-2021-44228, CVSS 10.0), which allows unauthenticated remote code execution and should be treated as P0. Immediate patching to Log4j 2.17.1+ is recommended..."
}
```

---

## 6. Red Team — Adversarial URL Generation

**Request:**
```json
POST /api/redteam/generate
{
  "legitimate_domain": "example.com",
  "techniques": ["homoglyphs", "subdomain", "tld_swap"],
  "count_per_technique": 2,
  "authorized_by": "Security Team / PT-2025-001"
}
```

**Response:**
```json
{
  "legitimate_domain": "example.com",
  "variants": [
    {
      "variant": "еxample.com",
      "technique": "homoglyphs",
      "explanation": "The 'e' is replaced with a Cyrillic 'е' (U+0435) that is visually identical in most fonts. The domain resolves differently but looks the same in the browser address bar.",
      "risk_level": "HIGH"
    },
    {
      "variant": "secure-example.com",
      "technique": "subdomain",
      "explanation": "Prepending 'secure-' exploits users who scan left-to-right and see a reassuring word before noticing the unfamiliar domain name.",
      "risk_level": "HIGH"
    },
    {
      "variant": "example.xyz",
      "technique": "tld_swap",
      "explanation": "Swapping .com for .xyz is a cheap registration that users may miss when copying or typing a URL.",
      "risk_level": "LOW"
    }
  ],
  "technique_summary": "These variants demonstrate that homoglyph and subdomain attacks present the highest risk as they are hardest to detect without careful inspection...",
  "disclaimer": "For authorized penetration testing and phishing simulation only. Ensure written authorization from the target organization before use.",
  "authorized_by": "Security Team / PT-2025-001"
}
```
