FROM python:3.11-slim

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency configuration and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy API application source
COPY app /app/app

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose default port
EXPOSE 8000

# Support dynamic PORT injection from Railway, Render, or Heroku
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
