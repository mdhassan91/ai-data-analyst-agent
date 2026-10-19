# -slim, not the full python image - shaves a few hundred MB off the image,
# which matters both for deploy speed and for the disk footprint on a
# small VM.
FROM python:3.12-slim

WORKDIR /app

# Copy just the requirements file first, install, THEN copy the rest of
# the code. This ordering means Docker can reuse the cached "pip install"
# layer whenever the app code changes but the dependencies don't -
# much faster rebuilds during development.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

EXPOSE 8000

# --workers 1: deliberate choice for a small VM. Each extra worker is a
# full separate process with its own memory - one worker is enough for
# this app's traffic level, and keeps memory use predictable.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
