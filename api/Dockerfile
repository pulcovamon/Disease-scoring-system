FROM python:3.12-slim

COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt

WORKDIR /app
COPY . /app/api

ENV PYTHONPATH=/app

EXPOSE 8080
CMD ["python", "-m", "api.main"]
