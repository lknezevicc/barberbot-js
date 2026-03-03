FROM node:20-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY common ./common
COPY booking-service ./booking-service

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @barberbot/common build
RUN pnpm --filter booking-service build

EXPOSE 3002

CMD ["pnpm", "--filter", "booking-service", "start:prod"]
