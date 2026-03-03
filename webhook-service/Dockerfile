FROM node:20-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY common ./common
COPY webhook-service ./webhook-service

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @barberbot/common build
RUN pnpm --filter webhook-service build

EXPOSE 3000

CMD ["pnpm", "--filter", "webhook-service", "start:prod"]
