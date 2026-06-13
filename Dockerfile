FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    # Platform paths
    PLATFORM_WEB_DIR=/app/web \
    # URL Shield paths
    CYBERSHIELD_WEB_DIR=/app/web \
    CYBERSHIELD_GLOSSARY_DIR=/app/cybersecurity_terms \
    CYBERSHIELD_MODEL_PATH=/app/models/model.joblib \
    CYBERSHIELD_METRICS_PATH=/app/models/metrics.json \
    # CVE Intel paths
    CVE_INTEL_NVD_DIR=/data/nvd \
    CVE_INTEL_INDEX_DIR=/data/index

WORKDIR /app

# Install dependencies (cached layer)
COPY pyproject.toml requirements.txt ./
COPY src ./src
RUN pip install --no-cache-dir -e .

# Pre-download sentence-transformers model at build time
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy app assets
COPY web ./web
COPY cybersecurity_terms ./cybersecurity_terms

# Train phishing model at build time for instant startup
RUN platform url train --cv 0

# Non-root user for security
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

VOLUME ["/data/nvd", "/data/index"]
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=25s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/healthz').getcode()==200 else 1)"

CMD ["uvicorn", "platform_core.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
