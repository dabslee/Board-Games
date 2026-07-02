# Build context is the repo root (see docker-compose.yml) so this stage
# can reach GomokuApp/ for the web export.
FROM node:20 AS web-build

WORKDIR /build/GomokuApp

COPY GomokuApp/package.json GomokuApp/package-lock.json ./
RUN npm ci

COPY GomokuApp/ ./
RUN npx expo export --platform web

FROM python:3.13-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY backend/app.py .
COPY --from=web-build /build/GomokuApp/dist ./webdist

EXPOSE 8080

# Single worker: game state lives in an in-memory dict (GAMES), so multiple
# worker processes would each hold a different, disjoint set of games.
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "4", "app:app"]
