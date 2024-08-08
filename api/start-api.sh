#!/bin/bash
echo "Waiting for MySQL to be available..."
while ! curl -s http://catalog_db:3305; do
  echo "MySQL not available yet, sleeping..."
  sleep 3
done
echo "MySQL is up - executing application..."
python main.py
