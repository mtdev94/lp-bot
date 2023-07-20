FROM node:alpine

WORKDIR /bot

COPY . .

RUN npm ci

RUN npm run build