FROM node:18-alpine

WORKDIR /app

COPY air-pollution /app

RUN npm install

EXPOSE 3000

RUN npm run build

RUN npm install -g serve

CMD serve -s build -l 3000