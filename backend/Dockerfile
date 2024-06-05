FROM python:3.12

WORKDIR /app

COPY . /app

RUN pip install --upgrade pip

RUN pip install -r requirements.txt

RUN python create_db.py

EXPOSE 5050

CMD ["python", "main.py"]