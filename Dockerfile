FROM node:alpine AS prepare

ARG ENVIRONMENT

RUN mkdir -p /usr/share/nginx/html/assets
COPY ./index.html /usr/share/nginx/html/index.html
COPY ./assets /usr/share/nginx/html/assets
COPY ./favicon.ico /usr/share/nginx/html
COPY ./manifest.json /usr/share/nginx/html
COPY ./service-worker.js /usr/share/nginx/html
COPY ./scripts /scripts

RUN node /scripts/environment.common.js
RUN node /scripts/environment.prod.js

FROM nginx:alpine

COPY --from=prepare /usr/share/nginx/html /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
