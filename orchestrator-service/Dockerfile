FROM node:20-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY common ./common
COPY orchestrator-service ./orchestrator-service

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @barberbot/common build
RUN pnpm --filter orchestrator-service build

EXPOSE 3001

CMD ["pnpm", "--filter", "orchestrator-service", "start:prod"]
