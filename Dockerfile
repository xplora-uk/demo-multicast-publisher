FROM node:16-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src src
RUN npm run build

FROM node:16-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
RUN chown node:node .
USER node
COPY package*.json ./
RUN npm i
RUN npm i -g pm2
COPY --from=builder /usr/src/app/build/ build/
EXPOSE 3000
ENTRYPOINT [ "pm2", "start", "build/index.js" ]
