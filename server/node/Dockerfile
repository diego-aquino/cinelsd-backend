FROM node:20.7.0-alpine3.18 AS base

ARG PNPM_VERSION=8.5.1
ENV PNPM_HOME=/pnpm
ENV PATH=$PATH:$PNPM_HOME

WORKDIR /app

RUN corepack enable

FROM base AS release-deps

COPY ./pnpm-lock.yaml ./
RUN pnpm fetch --prod

COPY ./package.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --offline --frozen-lockfile --prod

FROM base AS build

COPY ./pnpm-lock.yaml ./
RUN pnpm fetch

COPY ./package.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --offline --frozen-lockfile

COPY ./src ./src
COPY tsup.config.ts tsconfig.json ./
RUN NODE_ENV=production pnpm build

FROM base AS release

COPY --from=release-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

ENV NODE_ENV=production
EXPOSE $PORT

CMD /app/node_modules/pm2/bin/pm2-runtime \
  build/index.js \
  --name=server-node \
  --exec_mode=cluster \
  --instances=${SERVER_INSTANCES:-1}
