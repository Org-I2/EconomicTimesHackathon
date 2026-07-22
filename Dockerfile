FROM python:3.11-slim

# Install system dependencies (Tesseract OCR and required C libraries for OpenCV)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt-get/lists/*

WORKDIR /app

# Step 1: Install CPU-only PyTorch first (reduces image size from ~2.5GB down to ~180MB)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Step 2: Copy requirements and install remaining python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 3: Copy workspace source code
COPY . .

# Expose port (Render sets $PORT dynamically)
EXPOSE 8000

# Run FastAPI backend using uvicorn
CMD ["sh", "-c", "uvicorn Backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
