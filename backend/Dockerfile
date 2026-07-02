FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY app.py .

EXPOSE 8080

# Single worker: game state lives in an in-memory dict (GAMES), so multiple
# worker processes would each hold a different, disjoint set of games.
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "4", "app:app"]
