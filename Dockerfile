FROM nginx:alpine

COPY ./index.html /usr/share/nginx/html/index.html
COPY ./assets /usr/share/nginx/html/assets
COPY ./favicon.ico /usr/share/nginx/html
COPY ./manifest.json /usr/share/nginx/html
COPY ./service-worker.js /usr/share/nginx/html

RUN apk add --no-cache nodejs npm
WORKDIR /scripts
RUN npm init -y
RUN npm install dotenv
COPY ./scripts /scripts
COPY .env /scripts/.env
RUN node /scripts/environment.common.js
RUN node /scripts/environment.prod.js

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]