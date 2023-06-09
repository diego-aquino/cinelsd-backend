ARG PNPM_VERSION=8.5.1

FROM node:18.16.0-alpine3.17 AS release

ARG PNPM_VERSION
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PATH:$PNPM_HOME
RUN npm install -g pnpm@$PNPM_VERSION
RUN pnpm add pm2 --global

WORKDIR /app

COPY ./pnpm-lock.yaml ./
RUN pnpm fetch

COPY ./package.json ./
RUN pnpm install --offline

COPY ./src ./src
COPY tsup.config.ts ./
RUN pnpm build

RUN pnpm prune --prod

ENV NODE_ENV=production
EXPOSE $PORT

CMD ["pnpm", "start:container"]
