FROM nginx:alpine

COPY ./index.html /usr/share/nginx/html/index.html
COPY ./assets /usr/share/nginx/html/assets
COPY ./favicon.ico /usr/share/nginx/html
COPY ./manifest.json /usr/share/nginx/html
COPY ./service-worker.js /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
