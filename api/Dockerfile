FROM python:3.12

COPY requirements.txt /tmp

RUN pip install --upgrade pip

RUN pip install -r /tmp/requirements.txt

WORKDIR /app

COPY . /app/api

EXPOSE 8080

CMD ["python", "api/main.py"]