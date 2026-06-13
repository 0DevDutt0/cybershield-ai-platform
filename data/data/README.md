# Data

CyberShield AI ships with **synthetic, illustrative** data so the project trains
and runs out of the box with no downloads.

## Files

| File | Description |
|------|-------------|
| `seed_urls.csv` | A small, hand-curated sample (`url,label`) used for demos and sanity checks. Benign rows are real, well-known sites; phishing rows are **synthetic** examples of documented attack patterns — they are *not* live malicious links. |
| `generated_dataset.csv` | Created on demand by `cybershield generate-data` (git-ignored). |

`label` is `1` for phishing / malicious and `0` for benign.

## How the training data is produced

By default `cybershield train` generates a reproducible synthetic corpus with
[`cybershield.data.generate.generate_dataset`](../src/cybershield/data/generate.py).
URLs are synthesised from realistic structural templates (benign domains with
clean paths; phishing URLs combining IP hosts, `@` tricks, abused TLDs,
shorteners, punycode, and credential keywords), with a small fraction of
deliberately ambiguous examples so the model learns genuine signal.

> ⚠️ **This data is for demonstration and education only.** It is designed to
> exercise the feature pipeline and produce honest, non-trivial metrics — not to
> represent the full diversity of real-world phishing.

## Using a real dataset

For production-grade results, retrain on a real corpus. Any CSV with a
`url,label` header works:

```bash
cybershield train --data path/to/real_urls.csv
```

Good public sources:

- **PhishTank** — community-verified phishing URLs: <https://phishtank.org/>
- **OpenPhish** — phishing feed: <https://openphish.com/>
- **Kaggle — "Phishing Site URLs"** and similar labelled datasets
- **UCI ML Repository — Phishing Websites Data Set**
- **Tranco / Majestic Million** — popular (benign) domains for the negative class

Always combine fresh phishing samples with an up-to-date benign set, and
re-evaluate the metrics reported by `cybershield train`.
