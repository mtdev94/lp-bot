FROM node:20-alpine3.17

WORKDIR /bot

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY . ./

RUN npm run build