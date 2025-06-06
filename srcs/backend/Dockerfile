FROM node:23.11.0-alpine3.21
RUN apk add --no-cache sqlite
WORKDIR /usr/transcendence
COPY . .
CMD ["sh","node_start.sh"]
