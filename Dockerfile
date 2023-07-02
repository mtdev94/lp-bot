FROM node:20-alpine3.17

WORKDIR /bot
COPY . .
RUN npm ci
RUN npm run build