ARG PNPM_VERSION=8.5.1

FROM node:16.17.0-alpine3.16 AS release

ARG PNPM_VERSION
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PATH:$PNPM_HOME
RUN npm install -g pnpm@$PNPM_VERSION

WORKDIR /app

COPY ./package.json ./pnpm-lock.yaml ./
RUN pnpm install

COPY ./src ./src
RUN pnpm install

EXPOSE $PORT

CMD ["pnpm", "start"]
