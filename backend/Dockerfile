FROM python:3.12-slim as base

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Fix for pkg_resources (setuptools)
RUN pip install --no-cache-dir --upgrade pip "setuptools<70" wheel

WORKDIR /app

# Install Python dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy application code
COPY . .

# ─── Development Stage ──────────────────────────────────────────────────────
FROM base as development
RUN pip install --no-cache-dir ".[dev]"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ─── Production Stage ───────────────────────────────────────────────────────
FROM base as production
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
