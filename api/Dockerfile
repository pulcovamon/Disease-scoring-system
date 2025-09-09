FROM python:3.12

WORKDIR /api

COPY . /api

RUN pip install --upgrade pip

RUN pip install -r requirements.txt

EXPOSE 8080

CMD ["python", "main.py"]