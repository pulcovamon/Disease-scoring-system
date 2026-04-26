FROM python:3.12-slim

WORKDIR /app

COPY worker/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip \
    && pip install -r /app/requirements.txt \
    && pip install flower==2.0.1

COPY worker /app/worker

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

CMD ["celery", "-A", "worker.tasks", "flower", "--port=5555"]
