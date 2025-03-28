FROM nginx:alpine

WORKDIR /usr/share/nginx/html

RUN apk add --no-cache nodejs npm supervisor openssl

RUN mkdir -p /etc/nginx/ssl

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/privkey.pem -out /etc/nginx/ssl/fullchain.pem \
  -subj "/C=ES/ST=Malaga/L=Malaga/O=42Malaga/OU=DefaultUnit/CN=localhost"

# TODO: CHANGE THIS WHEN DEVELOPMENT IS DONE
RUN sed -i "s|user  nginx;|user  root;|g" /etc/nginx/nginx.conf
RUN mkdir -p /var/log/supervisord

COPY config/nginx.conf /etc/nginx/conf.d/default.conf

COPY package.json .
COPY config/supervisor.conf /etc/supervisor.conf

CMD ["sh", "config/start_front.sh"]
