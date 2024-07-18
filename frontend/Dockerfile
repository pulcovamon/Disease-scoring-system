FROM node:alpine as builder
WORKDIR /app
COPY . /app
RUN npm install
RUN npm run build


FROM nginx:alpine
COPY nginx.conf /etx/nginx/conf.d/defaul.conf
COPY --from=builder /app/build /usr/share/nginx/html